import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { StoreProvider } from "@/components/shell/StoreProvider";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    if (!data.user.email_confirmed_at) {
      sessionStorage.setItem("kudi_otp_email", data.user.email ?? "");
      throw redirect({ to: "/verify-email", search: { email: data.user.email ?? "" } });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  return (
    <StoreProvider userId={user.id}>
      <Outlet />
    </StoreProvider>
  );
}
