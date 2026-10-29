import { useEffect, useState } from "react";
import { MessageSquareText, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";

const DISMISSED = "strap-review-prompt-dismissed";
const SUBMITTED = "strap-review-prompt-submitted";

export function StrapReviewPrompt() {
  const { store, userId } = useStoreContext();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (!store?.id) return; try { if (localStorage.getItem(DISMISSED) || localStorage.getItem(SUBMITTED)) return; } catch {} const timer = window.setTimeout(() => setOpen(true), 18_000); return () => window.clearTimeout(timer); }, [store?.id]);
  if (!open || !store) return null;
  async function submit() { if (!rating) { toast.error("Choose a rating first."); return; } setSubmitting(true); try { const { error } = await supabase.from("store_feedback").insert({ store_id: store.id, feedback_type: "strap_review", rating, reason: "product_review", message: message.trim(), contact_email: "" }); if (error) throw new Error(error.message); try { localStorage.setItem(SUBMITTED, "1"); } catch {} setOpen(false); toast.success("Thanks — your feedback helps us improve Strap."); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save your feedback."); } finally { setSubmitting(false); } }
  function dismiss() { try { localStorage.setItem(DISMISSED, "1"); } catch {} setOpen(false); }
  return <div className="fixed inset-x-4 bottom-4 z-[100] sm:left-auto sm:right-5 sm:w-[390px]"><div className="rounded-[24px] border border-border bg-background/95 p-5 shadow-2xl backdrop-blur-xl"><div className="flex items-start justify-between gap-4"><div><div className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><MessageSquareText className="size-5"/></div><p className="mt-4 text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">A quick question</p><h2 className="mt-1 font-display text-lg font-bold">How is Strap working for you?</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">A short review helps us decide what to improve next.</p></div><button type="button" aria-label="Dismiss review prompt" onClick={dismiss} className="flex size-8 items-center justify-center rounded-lg hover:bg-secondary"><X className="size-4"/></button></div><div className="mt-5"><p className="text-xs font-semibold">Your rating</p><div className="mt-2 flex gap-1">{[1,2,3,4,5].map(value=><button key={value} type="button" onClick={()=>setRating(value)} aria-label={`${value} stars`} className="rounded-lg p-1.5 hover:bg-secondary"><Star className={`size-6 ${value<=rating?"fill-current text-accent-ink":"text-muted-foreground/40"}`}/></button>)}</div></div><Textarea value={message} onChange={e=>setMessage(e.target.value)} maxLength={2000} placeholder="What should we keep, improve or fix?" className="mt-4 min-h-24 resize-none"/><Button disabled={submitting} className="mt-4 h-11 w-full rounded-xl" onClick={()=>void submit()}>{submitting?"Saving…":"Send feedback"}</Button></div></div>;
}
