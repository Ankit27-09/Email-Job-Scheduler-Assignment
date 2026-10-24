import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { EmailStatus, MailboxKind, ScheduleRequest } from "@/types/api";

// Lists poll so emails visibly move from Scheduled to Sent while the worker runs.
const REFRESH_MS = 5000;
const PAGE_SIZE = 25;

export const emailKeys = {
  all: ["emails"] as const,
  list: (kind: MailboxKind, filters: EmailFilters) => [...emailKeys.all, "list", kind, filters] as const,
  counts: () => [...emailKeys.all, "counts"] as const,
  detail: (id: string) => [...emailKeys.all, "detail", id] as const,
};

export interface EmailFilters {
  search: string;
  status?: EmailStatus;
}

export function useEmailList(kind: MailboxKind, filters: EmailFilters) {
  return useInfiniteQuery({
    queryKey: emailKeys.list(kind, filters),
    queryFn: ({ pageParam }) => api.listEmails(kind, { ...filters, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
    refetchInterval: REFRESH_MS,
    placeholderData: keepPreviousData,
  });
}

export function useEmailCounts() {
  return useQuery({
    queryKey: emailKeys.counts(),
    queryFn: api.counts,
    refetchInterval: REFRESH_MS,
  });
}

export function useEmail(id: string) {
  return useQuery({
    queryKey: emailKeys.detail(id),
    queryFn: () => api.email(id),
    // Keep polling until the email reaches a final state.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "SENT" || status === "FAILED" ? false : REFRESH_MS;
    },
  });
}

export function useScheduleEmails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ScheduleRequest) => api.schedule(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: emailKeys.all }),
  });
}

export function useSenders() {
  return useQuery({ queryKey: ["senders"], queryFn: api.senders, staleTime: Infinity });
}
