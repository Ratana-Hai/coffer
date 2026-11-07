"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  beginTotpEnrollment,
  confirmTotpEnrollment,
  disableTotp,
} from "@/features/auth/actions";

type Mode = "idle" | "enroll" | "disable";

export function SecurityCard({ enabled: initialEnabled }: { enabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [mode, setMode] = useState<Mode>("idle");
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function startEnroll() {
    setError(null);
    const result = await beginTotpEnrollment();
    setQrSvg(result.qrSvg);
    setCode("");
    setMode("enroll");
  }

  function submitEnroll(formData: FormData) {
    startTransition(async () => {
      const result = await confirmTotpEnrollment({ ok: true }, formData);
      if (result.ok) {
        setEnabled(true);
        setMode("idle");
        setQrSvg(null);
        setCode("");
        toast.success("Two-factor authentication enabled");
      } else {
        setError(result.message ?? "Incorrect code");
      }
    });
  }

  function submitDisable(formData: FormData) {
    startTransition(async () => {
      const result = await disableTotp({ ok: true }, formData);
      if (result.ok) {
        setEnabled(false);
        setMode("idle");
        setCode("");
        toast.success("Two-factor authentication disabled");
      } else {
        setError(result.message ?? "Incorrect code");
      }
    });
  }

  function cancel() {
    setMode("idle");
    setQrSvg(null);
    setCode("");
    setError(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          {enabled
            ? "Two-factor authentication is on. Disabling requires a current code."
            : "Add a second factor to protect your ledger."}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        {mode === "idle" ? (
          <Button type="button" variant="outline" onClick={enabled ? () => setMode("disable") : startEnroll}>
            {enabled ? "Turn off two-factor" : "Set up two-factor"}
          </Button>
        ) : null}

        {mode === "enroll" ? (
          <div className="grid gap-4">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {qrSvg ? (
                <div
                  aria-label="QR code"
                  className="rounded-xl border border-line bg-white p-2 [&_svg]:block [&_svg]:size-40"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : null}
              <p className="max-w-xs text-sm text-muted">
                Scan the code with your authenticator app, then enter the 6-digit code to confirm.
              </p>
            </div>
            <form action={submitEnroll} className="grid gap-2">
              <Label htmlFor="enroll-code">6-digit code</Label>
              <Input
                id="enroll-code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="000000"
                className="font-mono tracking-[0.3em]"
              />
              {error ? <p className="text-sm text-negative">{error}</p> : null}
              <div className="mt-1 flex gap-2">
                <Button type="submit" disabled={pending}>
                  {pending ? "Confirming…" : "Confirm"}
                </Button>
                <Button type="button" variant="ghost" onClick={cancel} disabled={pending}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : null}

        {mode === "disable" ? (
          <form action={submitDisable} className="grid gap-2">
            <Label htmlFor="disable-code">Enter your current code to turn it off</Label>
            <Input
              id="disable-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="000000"
              className="font-mono tracking-[0.3em]"
            />
            {error ? <p className="text-sm text-negative">{error}</p> : null}
            <div className="mt-1 flex gap-2">
              <Button type="submit" variant="destructive" disabled={pending}>
                {pending ? "Turning off…" : "Turn off"}
              </Button>
              <Button type="button" variant="ghost" onClick={cancel} disabled={pending}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
