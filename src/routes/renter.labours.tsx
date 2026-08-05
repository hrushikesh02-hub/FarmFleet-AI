import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/renter/labours")({
  component: LabourLayout,
});

function LabourLayout() {
  return <Outlet />;
}