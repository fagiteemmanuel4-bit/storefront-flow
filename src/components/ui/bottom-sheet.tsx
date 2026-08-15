import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

/**
 * Draggable bottom sheet used for every modal in the app.
 * Slides up from the bottom, can be dragged back down to dismiss.
 */
const BottomSheet = ({
  shouldScaleBackground = true,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => {
  // Remember what was focused before opening so focus can be returned on close.
  const opener = React.useRef<HTMLElement | null>(null);

  return (
    <DrawerPrimitive.Root
      shouldScaleBackground={shouldScaleBackground}
      onOpenChange={(open) => {
        if (open) {
          opener.current = document.activeElement as HTMLElement | null;
        } else {
          const target = opener.current;
          opener.current = null;
          // Wait for the sheet to unmount before restoring focus.
          window.setTimeout(() => {
            if (target && document.contains(target)) target.focus({ preventScroll: true });
          }, 250);
        }
        onOpenChange?.(open);
      }}
      {...props}
    />
  );
};
BottomSheet.displayName = "BottomSheet";

const BottomSheetTrigger = DrawerPrimitive.Trigger;
const BottomSheetClose = DrawerPrimitive.Close;
const BottomSheetPortal = DrawerPrimitive.Portal;

const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-foreground/40 backdrop-blur-[2px]", className)}
    {...props}
  />
));
BottomSheetOverlay.displayName = "BottomSheetOverlay";

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <BottomSheetPortal>
    <BottomSheetOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mx-auto mt-24 flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-[28px] border border-border bg-surface shadow-2xl outline-none sm:mb-4 sm:rounded-[32px] sm:border-border/70",
        className,
      )}
      {...props}
    >
      <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" aria-hidden />
      <div className="flex flex-col gap-4 overflow-y-auto px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-7 sm:pb-7">
        {children}
      </div>
    </DrawerPrimitive.Content>
  </BottomSheetPortal>
));
BottomSheetContent.displayName = "BottomSheetContent";

const BottomSheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 text-left", className)} {...props} />
);
BottomSheetHeader.displayName = "BottomSheetHeader";

const BottomSheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
    {...props}
  />
);
BottomSheetFooter.displayName = "BottomSheetFooter";

const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("font-display text-xl font-bold tracking-tight", className)}
    {...props}
  />
));
BottomSheetTitle.displayName = "BottomSheetTitle";

const BottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
BottomSheetDescription.displayName = "BottomSheetDescription";

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetPortal,
  BottomSheetOverlay,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetFooter,
  BottomSheetTitle,
  BottomSheetDescription,
};
