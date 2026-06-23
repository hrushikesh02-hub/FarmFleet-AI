import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";

export const Route = createFileRoute("/not-found")({
  component: NotFound,
});

function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-soft px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-elevated">
          <Sprout className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="mt-6 font-display text-7xl font-bold text-gradient">404</h1>
        <p className="mt-2 text-lg font-semibold">This field is empty</p>
        <p className="mt-1 text-muted-foreground text-sm">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-soft">
          Back to home
        </Link>
      </div>
    </div>
  );
}
