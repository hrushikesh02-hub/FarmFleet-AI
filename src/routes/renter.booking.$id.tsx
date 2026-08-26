import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/renter/booking/$id")({
  component: RedirectBooking,
});

function RedirectBooking() {
  const { id } = Route.useParams();
  return <Navigate to="/renter/equipment/$id" params={{ id }} replace />;
}
