import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { StoreProvider } from "@/components/shell/StoreProvider";
import { WelcomeTour } from "@/components/shell/WelcomeTour";
import { StrapReviewPrompt } from "@/components/site/StrapReviewPrompt";
import { RouteLoadingOverlay } from "@/components/shell/RouteLoadingOverlay";
import { isPaidArea } from "@/lib/plan-access";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    if (!data.user.email_confirmed_at) {
      sessionStorage.setItem("kudi_otp_email", data.user.email ?? "");
      throw redirect({ to: "/verify-email", search: { email: data.user.email ?? "" } });
    }
    if (isPaidArea(location.pathname)) {
      const { data: memberships } = await supabase.from("store_members").select("store_id").eq("user_id", data.user.id).limit(1);
      const storeId = memberships?.[0]?.store_id;
      if (storeId) {
        const { data: subscription } = await supabase.from("store_subscriptions").select("plan_code,status").eq("store_id", storeId).maybeSingle();
        const active = subscription?.status === "active" && (subscription?.plan_code === "business" || subscription?.plan_code === "pro");
        if (!active) throw redirect({ to: "/upgrade" });
      }
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  return <StoreProvider userId={user.id}><RouteLoadingOverlay/><Outlet/><WelcomeTour/><StrapReviewPrompt/></StoreProvider>;
}
