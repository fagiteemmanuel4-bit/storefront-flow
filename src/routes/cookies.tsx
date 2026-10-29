import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [{ title: "Cookies & Storage Policy — Strap" }, { name: "description", content: "How Strap uses cookies, browser storage and offline data." }] }),
  component: Cookies,
});

function Cookies() {
  return <div className="min-h-screen bg-surface"><SiteHeader /><main className="mx-auto max-w-4xl px-4 py-14 sm:px-6"><p className="text-label-caps text-muted-foreground">Legal</p><h1 className="mt-2 text-display-md">Cookies & browser storage</h1><p className="mt-4 max-w-3xl text-muted-foreground">Strap uses cookies and browser storage primarily to keep the application secure and functional. This page explains the categories and the choices available to users.</p><p className="mt-3 text-sm text-muted-foreground">Effective date: 19 August 2026</p><div className="mt-10 space-y-8 text-[15px] leading-7 text-muted-foreground">
    <section><h2 className="font-display text-xl font-bold text-foreground">Necessary technologies</h2><p className="mt-3">These technologies are required for authentication, sessions, security, preferences and core application functionality. They cannot normally be disabled without affecting the service.</p></section>
    <section><h2 className="font-display text-xl font-bold text-foreground">Offline storage</h2><p className="mt-3">Strap may store temporary transaction information in browser storage so a supported offline workflow can continue while the device has no network connection. This information is intended to synchronize when connectivity returns. Users should secure shared devices and avoid clearing site data before pending transactions synchronize.</p></section>
    <section><h2 className="font-display text-xl font-bold text-foreground">Preferences</h2><p className="mt-3">We may remember preferences such as interface settings or recently selected options so the application behaves consistently.</p></section>
    <section><h2 className="font-display text-xl font-bold text-foreground">Analytics and optional technologies</h2><p className="mt-3">If Strap introduces optional analytics, advertising or marketing cookies, the relevant consent/choice mechanism and notice will identify them before they are used where required by law. We will not describe optional technologies as necessary when they are not.</p></section>
    <section><h2 className="font-display text-xl font-bold text-foreground">Managing cookies</h2><p className="mt-3">You can control cookies through your browser settings. Blocking necessary cookies or clearing site storage can sign you out, remove preferences or affect offline queues. For privacy requests, contact <strong className="text-foreground">[PRIVACY/DPO EMAIL]</strong>.</p></section>
    <section><h2 className="font-display text-xl font-bold text-foreground">Changes</h2><p className="mt-3">We may update this policy when our technologies change. The effective date above will be updated when a material revision is published.</p></section>
  </div></main><SiteFooter /></div>;
}
