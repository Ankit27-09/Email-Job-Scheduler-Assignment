import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { FormRow } from "@/components/compose/FormRow";
import { NumberBox } from "@/components/compose/NumberBox";
import { RecipientField } from "@/components/compose/RecipientField";
import { RichTextEditor } from "@/components/compose/RichTextEditor";
import { SendLaterPopover } from "@/components/compose/SendLaterPopover";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { useScheduleEmails, useSenders } from "@/hooks/useEmails";
import { errorMessage } from "@/lib/api";
import type { ScheduleRequest } from "@/types/api";

interface ComposeForm {
  senderId: string;
  recipients: string[];
  subject: string;
  body: string;
  delaySeconds: string;
  hourlyLimit: string;
  sendAt: Date | null;
}

const initialForm: ComposeForm = {
  senderId: "",
  recipients: [],
  subject: "",
  body: "",
  delaySeconds: "",
  hourlyLimit: "",
  sendAt: null,
};

function validate(form: ComposeForm): string | null {
  if (!form.senderId) return "Choose a sender";
  if (form.recipients.length === 0) return "Add at least one recipient or upload a list";
  if (!form.subject.trim()) return "Subject is required";
  if (!form.body) return "Write a message";
  if (!form.hourlyLimit || Number(form.hourlyLimit) < 1) return "Set an hourly limit of at least 1";
  if (form.sendAt && form.sendAt.getTime() < Date.now() - 60_000) return "The scheduled time is in the past";
  return null;
}

export function ComposePage() {
  const navigate = useNavigate();
  const senders = useSenders();
  const schedule = useScheduleEmails();
  const [form, setForm] = useState<ComposeForm>(initialForm);

  const set = <K extends keyof ComposeForm>(key: K, value: ComposeForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Default to the first sender once they load.
  useEffect(() => {
    if (!form.senderId && senders.data?.length) set("senderId", senders.data[0].id);
  }, [senders.data, form.senderId]);

  const submit = () => {
    const problem = validate(form);
    if (problem) {
      toast.error(problem);
      return;
    }

    const body: ScheduleRequest = {
      senderId: form.senderId,
      recipients: form.recipients,
      subject: form.subject.trim(),
      body: form.body,
      startAt: (form.sendAt ?? new Date()).toISOString(),
      delaySeconds: Number(form.delaySeconds || 0),
      hourlyLimit: Number(form.hourlyLimit),
    };

    schedule.mutate(body, {
      onSuccess: (res) => {
        toast.success(
          `Scheduled ${res.count.toLocaleString()} email${res.count === 1 ? "" : "s"}, first one ${format(new Date(res.firstSendAt), "EEE h:mm a")}`,
        );
        navigate("/scheduled");
      },
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  return (
    <div className="h-full overflow-y-auto">
      <PageHeader
        title="Compose New Email"
        backTo="/scheduled"
        actions={
          <>
            {form.sendAt && (
              <span className="hidden text-xs text-brand sm:inline">{format(form.sendAt, "EEE, MMM d · h:mm a")}</span>
            )}
            <SendLaterPopover value={form.sendAt} onChange={(v) => set("sendAt", v)} />
            <Button variant="outline" size="sm" loading={schedule.isPending} onClick={submit}>
              {form.sendAt ? "Send Later" : "Send"}
            </Button>
          </>
        }
      />

      <form
        className="mx-auto flex max-w-[860px] flex-col gap-1 px-6 pt-4 pb-16"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <FormRow label="From" htmlFor="from" bordered={false}>
          <select
            id="from"
            value={form.senderId}
            onChange={(e) => set("senderId", e.target.value)}
            disabled={senders.isPending}
            className="h-9 max-w-xs rounded-lg bg-field px-2.5 text-sm outline-none focus:ring-2 focus:ring-brand/30"
          >
            {senders.isPending && <option>Loading senders…</option>}
            {senders.data?.length === 0 && <option value="">No senders configured</option>}
            {senders.data?.map((s) => (
              <option key={s.id} value={s.id} title={s.name}>
                {s.email}
              </option>
            ))}
          </select>
        </FormRow>

        <FormRow label="To" htmlFor="to">
          <RecipientField id="to" recipients={form.recipients} onChange={(v) => set("recipients", v)} />
        </FormRow>

        <FormRow label="Subject" htmlFor="subject">
          <input
            id="subject"
            value={form.subject}
            onChange={(e) => set("subject", e.target.value)}
            placeholder="Subject"
            maxLength={300}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-[#b5b5b5]"
          />
        </FormRow>

        <div className="flex flex-wrap items-center gap-6 py-3">
          <NumberBox
            id="delay"
            label="Delay between 2 emails"
            value={form.delaySeconds}
            onChange={(v) => set("delaySeconds", v)}
            suffix="sec"
            max={3600}
          />
          <NumberBox
            id="hourly"
            label="Hourly Limit"
            value={form.hourlyLimit}
            onChange={(v) => set("hourlyLimit", v)}
            max={10000}
          />
        </div>

        <RichTextEditor value={form.body} onChange={(v) => set("body", v)} />
      </form>
    </div>
  );
}
