import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/renter/ai")({
  component: AILayout,
});

function AILayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}