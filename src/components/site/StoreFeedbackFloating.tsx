import { useEffect, useState } from "react";
import { Flag, MessageSquareWarning, Star, X } from "lucide-react";
import { toast } from "sonner";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { Button } from "@/components/ui/button";

export function StoreFeedbackFloating() {
  const [slug, setSlug] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"rating" | "report">("rating");
  const [rating, setRating] = useState(0);
  const [reason, setReason] = useState("misleading information");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const read = () => {
      const match = window.location.pathname.match(/^\/store\/([^/]+)\/?$/);
      setSlug(match ? decodeURIComponent(match[1]) : null);
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  if (!slug) return null;

  function openFeedback(nextMode: "rating" | "report") {
    setMode(nextMode);
    setRating(0);
    setMessage("");
    setEmail("");
    setDone(false);
    setOpen(true);
  }

  async function submit() {
    if (mode === "rating" && rating === 0) {
      toast.error("Choose a star rating first.");
      return;
    }
    if (mode === "report" && !message.trim()) {
      toast.error("Tell us what is wrong with this store.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: store, error: storeError } = await onlineSupabase.from("online_stores").select("store_id").eq("slug", slug).maybeSingle();
      if (storeError) throw new Error(storeError.message);
      if (!store?.store_id) throw new Error("This storefront could not be found.");
      const { error } = await onlineSupabase.from("store_feedback").insert({
        store_id: store.store_id,
        feedback_type: mode,
        rating: mode === "rating" ? rating : null,
        reason: mode === "report" ? reason : "",
        message: message.trim(),
        contact_email: email.trim(),
      });
      if (error) throw new Error(error.message);
      setDone(true);
      toast.success(mode === "rating" ? "Thanks for rating this store." : "Thanks. Your report was submitted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return <>
    <div className="fixed bottom-5 left-5 z-[35] flex flex-col gap-2 sm:bottom-6 sm:left-6">
      <button type="button" onClick={() => openFeedback("rating")} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/95 px-4 py-2.5 text-xs font-semibold text-foreground shadow-lift backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-secondary">
        <Star className="size-3.5" /> Rate store
      </button>
      <button type="button" onClick={() => openFeedback("report")} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/95 px-4 py-2.5 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur-xl transition hover:bg-secondary hover:text-foreground">
        <Flag className="size-3.5" /> Report store
      </button>
    </div>

    {open && <div className="fixed inset-0 z-[90] flex items-end justify-center bg-foreground/45 p-4 backdrop-blur-sm sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="store-feedback-title" className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-float">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div><p className="text-label-caps text-muted-foreground">Store feedback</p><h2 id="store-feedback-title" className="mt-1 font-display text-xl font-bold">{mode === "rating" ? "How was this store?" : "Report this store"}</h2></div>
          <button type="button" aria-label="Close feedback" onClick={() => setOpen(false)} className="flex size-9 items-center justify-center rounded-xl border border-border hover:bg-secondary"><X className="size-4" /></button>
        </div>
        {done ? <div className="p-7 text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent"><MessageSquareWarning className="size-6" /></div><h3 className="mt-4 font-display text-lg font-bold">Thank you</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Your feedback has been received. We use reports and ratings to keep the marketplace trustworthy.</p><Button className="mt-6 h-11 w-full rounded-xl" onClick={() => setOpen(false)}>Done</Button></div> : <div className="space-y-5 p-5">
          {mode === "rating" ? <>
            <div><p className="text-sm font-semibold">Your rating</p><div className="mt-3 flex gap-2" aria-label="Choose a rating">{[1,2,3,4,5].map((value) => <button key={value} type="button" aria-label={`${value} star${value > 1 ? "s" : ""}`} onClick={() => setRating(value)} className="rounded-lg p-1 transition hover:scale-110"><Star className={`size-8 ${value <= rating ? "fill-current text-accent-ink" : "text-muted-foreground/40"}`} /></button>)}</div></div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="field min-h-28 resize-none" maxLength={2000} placeholder="Tell us what you liked or what could be better (optional)" />
          </> : <>
            <label className="block space-y-2"><span className="text-sm font-semibold">What is wrong?</span><select value={reason} onChange={(e) => setReason(e.target.value)} className="field"><option>misleading information</option><option>counterfeit or suspicious products</option><option>scam or payment issue</option><option>inappropriate content</option><option>privacy or personal information</option><option>other</option></select></label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="field min-h-28 resize-none" maxLength={2000} placeholder="Describe the problem…" />
          </>}
          <label className="block space-y-2"><span className="text-sm font-semibold">Email <span className="font-normal text-muted-foreground">(optional)</span></span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" maxLength={320} placeholder="you@example.com" /></label>
          <Button disabled={submitting} className="h-12 w-full rounded-xl" onClick={() => void submit()}>{submitting ? "Submitting…" : mode === "rating" ? "Submit rating" : "Submit report"}</Button>
          <p className="text-center text-[11px] leading-5 text-muted-foreground">Do not include passwords, card numbers, or other sensitive information.</p>
        </div>}
        {!done && <div className="flex gap-2 border-t border-border bg-secondary/40 p-4"><button type="button" onClick={() => openFeedback("rating")} className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold ${mode === "rating" ? "bg-foreground text-background" : "hover:bg-secondary"}`}>Rate</button><button type="button" onClick={() => openFeedback("report")} className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold ${mode === "report" ? "bg-foreground text-background" : "hover:bg-secondary"}`}>Report</button></div>}
      </div>
    </div>}
  </>;
}
