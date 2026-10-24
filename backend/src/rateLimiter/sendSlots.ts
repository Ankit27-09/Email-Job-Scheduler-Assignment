import { redis } from "../lib/redis";

export const HOUR_MS = 60 * 60 * 1000;

export const hourWindowOf = (ts: number) => Math.floor(ts / HOUR_MS);
export const hourWindowStart = (window: number) => window * HOUR_MS;

/*
 * Rate limiting is done in two atomic Redis steps (Lua), so it holds across any
 * number of workers and machines:
 *
 * 1. Hourly quota - reserveHourlyQuota()
 *    Finds the first UTC clock hour (starting with the current one) where both the
 *    sender and the campaign are under their hourly limit, and increments both
 *    counters. If that hour is in the future, the job is delayed to its start.
 *
 * 2. Spacing - reserveSpacingSlot()
 *    Only called once a job is due. Hands out send times at least `gap` ms apart
 *    per sender and per campaign, by moving a "next free time" pointer forward.
 *
 * Keeping them separate means a campaign that is waiting for next hour's quota
 * never pushes the sender's spacing pointer into the future, so other campaigns
 * on the same sender keep flowing.
 */

const RESERVE_QUOTA_LUA = `
local startWindow = tonumber(ARGV[1])
local senderLimit = tonumber(ARGV[2])
local campaignLimit = tonumber(ARGV[3])
local senderPrefix = ARGV[4]
local campaignPrefix = ARGV[5]
local nowMs = tonumber(ARGV[6])
local HOUR = 3600000

for window = startWindow, startWindow + 24 * 31 do
  local senderKey = senderPrefix .. window
  local campaignKey = campaignPrefix .. window
  local senderCount = tonumber(redis.call('GET', senderKey) or '0')
  local campaignCount = tonumber(redis.call('GET', campaignKey) or '0')

  if senderCount < senderLimit and campaignCount < campaignLimit then
    -- keep counters until one hour after their window closes
    local ttl = (window + 2) * HOUR - nowMs
    redis.call('INCR', senderKey)
    redis.call('PEXPIRE', senderKey, ttl)
    redis.call('INCR', campaignKey)
    redis.call('PEXPIRE', campaignKey, ttl)
    return window
  end
end

return -1
`;

const RESERVE_SPACING_LUA = `
local now = tonumber(ARGV[1])
local senderGap = tonumber(ARGV[2])
local campaignGap = tonumber(ARGV[3])

local slot = now
local senderNext = tonumber(redis.call('GET', KEYS[1]) or '0')
local campaignNext = tonumber(redis.call('GET', KEYS[2]) or '0')
if senderNext > slot then slot = senderNext end
if campaignNext > slot then slot = campaignNext end

redis.call('SET', KEYS[1], slot + senderGap, 'PX', slot + senderGap - now + 60000)
redis.call('SET', KEYS[2], slot + campaignGap, 'PX', slot + campaignGap - now + 60000)
return slot
`;

export interface QuotaRequest {
  senderId: string;
  campaignId: string;
  senderHourlyLimit: number;
  campaignHourlyLimit: number;
  now?: number;
}

/** Reserves one send in the earliest hour window with capacity; returns that window index. */
export async function reserveHourlyQuota(req: QuotaRequest): Promise<number> {
  const now = req.now ?? Date.now();
  const result = await redis.eval(
    RESERVE_QUOTA_LUA,
    0,
    hourWindowOf(now),
    req.senderHourlyLimit,
    req.campaignHourlyLimit,
    `rl:sender:${req.senderId}:h:`,
    `rl:campaign:${req.campaignId}:h:`,
    now,
  );
  const window = Number(result);
  if (!Number.isFinite(window) || window < 0) {
    throw new Error("No hourly capacity available in the next 31 days");
  }
  return window;
}

export interface SpacingRequest {
  senderId: string;
  campaignId: string;
  senderGapMs: number;
  campaignGapMs: number;
  now?: number;
}

/** Returns the epoch-ms time at which this email may go out, honouring the minimum gaps. */
export async function reserveSpacingSlot(req: SpacingRequest): Promise<number> {
  const now = req.now ?? Date.now();
  const result = await redis.eval(
    RESERVE_SPACING_LUA,
    2,
    `rl:sender:${req.senderId}:next`,
    `rl:campaign:${req.campaignId}:next`,
    now,
    req.senderGapMs,
    req.campaignGapMs,
  );
  return Number(result);
}
