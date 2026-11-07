"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { clearAllData } from "../actions";

export function DataCard() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClear() {
    if (!confirming) {
      setConfirming(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setConfirming(false), 5000);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    startTransition(async () => {
      const result = await clearAllData();
      setConfirming(false);
      if (result.ok) toast.success("All data cleared");
      else toast.error("Could not clear data");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data</CardTitle>
        <CardDescription>
          Everything here belongs to your account and is visible only to you.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 pb-6">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/api/export?format=json" download>
              Export JSON
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/export?format=csv" download>
              Export CSV
            </a>
          </Button>
        </div>
        <div>
          <Button variant="destructive" onClick={handleClear} disabled={pending}>
            {confirming ? "Tap again to confirm" : "Clear all data"}
          </Button>
          <p className="mt-2 text-xs text-muted">
            Deletes every transaction, budget, loan and goal. Your account, profile and
            preferences stay.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
