import { useEffect, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function SecurityModal({ open, onOpenChange, title, description, children, footer, tone = "secure", dismissible = true }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children?: ReactNode; footer?: ReactNode; tone?: "secure" | "danger" | "success"; dismissible?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const preventClipboard = (event: ClipboardEvent) => event.preventDefault();
    const preventContext = (event: MouseEvent) => event.preventDefault();
    const preventSelection = (event: Event) => event.preventDefault();
    const preventDrag = (event: DragEvent) => event.preventDefault();
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ["a", "c", "x", "v", "s", "p"].includes(event.key.toLowerCase())) event.preventDefault();
    };
    document.addEventListener("copy", preventClipboard);
    document.addEventListener("cut", preventClipboard);
    document.addEventListener("paste", preventClipboard);
    document.addEventListener("contextmenu", preventContext);
    document.addEventListener("selectstart", preventSelection);
    document.addEventListener("dragstart", preventDrag);
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("security-modal-open");
    return () => {
      document.removeEventListener("copy", preventClipboard);
      document.removeEventListener("cut", preventClipboard);
      document.removeEventListener("paste", preventClipboard);
      document.removeEventListener("contextmenu", preventContext);
      document.removeEventListener("selectstart", preventSelection);
      document.removeEventListener("dragstart", preventDrag);
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("security-modal-open");
    };
  }, [open]);

  const Icon = tone === "danger" ? AlertTriangle : tone === "success" ? CheckCircle2 : ShieldCheck;
  const iconClass = tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-accent-soft text-accent-ink";

  return (
    <AlertDialog open={open} onOpenChange={dismissible ? onOpenChange : undefined}>
      <AlertDialogContent onEscapeKeyDown={(event) => { if (!dismissible) event.preventDefault(); }} onPointerDownOutside={(event) => { if (!dismissible) event.preventDefault(); }} onInteractOutside={(event) => { if (!dismissible) event.preventDefault(); }} className="security-modal w-[min(92vw,520px)] overflow-hidden rounded-3xl border-border/80 bg-surface p-0 shadow-2xl">
        <div className="select-none p-6 sm:p-7" onContextMenu={(event) => event.preventDefault()}>
          <AlertDialogHeader className="text-left">
            <div className={cn("mb-4 flex size-11 items-center justify-center rounded-2xl", iconClass)} aria-hidden><Icon className="size-5" /></div>
            <AlertDialogTitle className="text-xl tracking-tight">{title}</AlertDialogTitle>
            {description ? <AlertDialogDescription className="mt-1.5 leading-6">{description}</AlertDialogDescription> : null}
          </AlertDialogHeader>
          {children ? <div className="mt-6">{children}</div> : null}
          {footer ? <AlertDialogFooter className="mt-6 gap-2">{footer}</AlertDialogFooter> : null}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
