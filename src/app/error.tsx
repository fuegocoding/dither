"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { IconRefresh, IconAlertTriangle } from "@tabler/icons-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dither error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
        <IconAlertTriangle className="size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="font-sans text-lg font-bold text-foreground">
          Something went wrong
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          The dither engine tripped. Try reloading the page, or check the
          console for details.
        </p>
        {error.message && (
          <code className="mx-auto mt-2 max-w-md truncate border border-border bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground">
            {error.message}
          </code>
        )}
      </div>
      <Button onClick={reset} variant="outline">
        <IconRefresh className="size-3.5" />
        Try again
      </Button>
    </div>
  );
}
