import React, { useState } from "react";
import { HelpCircle, BookOpen, MessageSquare, Sparkles } from "lucide-react";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
} from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";

export function ContextualSupportDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open screen guidance and live support"
        title="Need help with this screen?"
        className="fixed bottom-20 right-5 z-40 hidden sm:flex size-12 items-center justify-center rounded-full bg-[#101116] text-[#CFF35B] shadow-2xl border border-[#CFF35B]/30 hover:scale-105 active:scale-95 transition-all"
      >
        <HelpCircle className="size-6" />
      </button>

      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent className="max-h-[85dvh] overflow-y-auto max-w-lg mx-auto">
          <BottomSheetHeader>
            <BottomSheetTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-accent-ink" />
              Strap In-App Assistance
            </BottomSheetTitle>
            <BottomSheetDescription>
              Instant help, contextual tips, and keyboard shortcuts for any screen.
            </BottomSheetDescription>
          </BottomSheetHeader>

          <div className="space-y-4 p-4">
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <h4 className="font-bold text-sm mb-1">Keyboard Shortcuts</h4>
              <ul className="text-xs space-y-1.5 text-muted-foreground">
                <li>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface border">Space</kbd> or{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-surface border">Enter</kbd> to quick-add
                  items
                </li>
                <li>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface border">Ctrl / Cmd + K</kbd> to
                  search products, customers, and orders
                </li>
                <li>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface border">Esc</kbd> to close open
                  drawers & modals
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <h4 className="font-bold text-sm mb-1">Human & Technical Support</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Have a question or stuck on an operation? Our dedicated commerce engineering support
                is available 24/7.
              </p>
              <div className="flex gap-2">
                <Button
                  asChild
                  size="sm"
                  className="rounded-xl flex-1 bg-accent text-accent-foreground font-bold hover:brightness-105"
                >
                  <a href="/support" target="_blank">
                    <MessageSquare className="size-3.5 mr-1.5" /> Contact Support
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-xl flex-1">
                  <a href="/docs" target="_blank">
                    <BookOpen className="size-3.5 mr-1.5" /> Read Guides
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}
