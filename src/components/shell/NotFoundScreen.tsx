import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFoundScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="numeric text-6xl font-bold text-accent">404</p>
        <h1 className="mt-4 text-title-lg">We couldn't find that page</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may be out of date, or the page has moved.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
