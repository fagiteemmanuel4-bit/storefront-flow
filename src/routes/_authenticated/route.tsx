import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { StoreProvider } from "@/components/shell/StoreProvider";
import { StrapReviewPrompt } from "@/components/site/StrapReviewPrompt";
import { RouteLoadingOverlay } from "@/components/shell/RouteLoadingOverlay";
import { isPaidArea } from "@/lib/plan-access";
import { AccountStatusModal, type AccountStatus } from "@/components/auth/AccountStatusModal";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const hiddenDuringUpgrade = [
      "/store-editor",
      "/settings/online-store",
      "/settings/appearance",
    ];
    if (
      hiddenDuringUpgrade.some(
        (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
      )
    ) {
      throw redirect({ to: "/dashboard", replace: true });
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    if (!data.user.email_confirmed_at) {
      sessionStorage.setItem("kudi_otp_email", data.user.email ?? "");
      throw redirect({ to: "/verify-email", search: { email: data.user.email ?? "" } });
    }
    if (isPaidArea(location.pathname)) {
      const { data: memberships } = await supabase
        .from("store_members")
        .select("store_id")
        .eq("user_id", data.user.id)
        .limit(1);
      const storeId = memberships?.[0]?.store_id;
      if (storeId) {
        const { data: subscription } = await supabase
          .from("store_subscriptions")
          .select("plan_code,status")
          .eq("store_id", storeId)
          .maybeSingle();
        const active =
          subscription?.status === "active" &&
          (subscription?.plan_code === "business" || subscription?.plan_code === "pro");
        if (!active) throw redirect({ to: "/upgrade" });
      }
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const [accountStatus, setAccountStatus] = useState<AccountStatus>("active");
  const [statusReason, setStatusReason] = useState<string | undefined>();

  useEffect(() => {
    // Check user metadata or profile status for suspension / ban enforcement
    const metaStatus = (user.user_metadata?.account_status || user.app_metadata?.account_status) as
      AccountStatus | undefined;
    const metaReason = (user.user_metadata?.status_reason || user.app_metadata?.status_reason) as
      string | undefined;

    if (metaStatus === "banned" || metaStatus === "suspended") {
      setAccountStatus(metaStatus);
      setStatusReason(metaReason);
      return;
    }

    // Also inspect staff_accounts or user metadata for suspension / ban
    void (supabase as any)
      .from("staff_accounts")
      .select("is_active")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: { data: { is_active?: boolean } | null }) => {
        if (data && data.is_active === false) {
          setAccountStatus("suspended");
          setStatusReason("Your staff account has been suspended by store administration.");
        }
      });
  }, [user]);

  return (
    <StoreProvider userId={user.id}>
      <RouteLoadingOverlay />
      <AccountStatusModal status={accountStatus} reason={statusReason} />
      <Outlet />
      <StrapReviewPrompt />
    </StoreProvider>
  );
}
