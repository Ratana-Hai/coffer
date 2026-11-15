"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsivePanel } from "@/components/shared/ResponsivePanel";
import { createGoal } from "../actions";
import { goalSchema } from "../schema";

interface AddGoalValues {
  name: string;
  target: string;
}

export function AddGoalPanel() {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddGoalValues>({
    resolver: zodResolver(goalSchema) as unknown as Resolver<AddGoalValues>,
    mode: "onTouched",
    defaultValues: { name: "", target: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("target", values.target);
    const result = await createGoal({ ok: true }, formData);
    if (result.ok) {
      reset({ name: "", target: "" });
      setOpen(false);
      toast.success("Goal created");
    } else {
      toast.error("message" in result && result.message ? result.message : "Could not create goal");
    }
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        New goal
      </Button>
      <ResponsivePanel
        open={open}
        onOpenChange={setOpen}
        title="New savings goal"
        description="Set a target and add funds as you save."
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-goal-form" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create goal"}
            </Button>
          </div>
        }
      >
        <form id="add-goal-form" onSubmit={onSubmit} noValidate className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="goal-name">Goal name</Label>
            <Input id="goal-name" maxLength={60} placeholder="e.g. Emergency fund" {...register("name")} />
            {errors.name ? <p className="text-sm text-negative">{errors.name.message}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="goal-target">Target amount</Label>
            <Input
              id="goal-target"
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              {...register("target")}
            />
            {errors.target ? <p className="text-sm text-negative">{errors.target.message}</p> : null}
          </div>
        </form>
      </ResponsivePanel>
    </>
  );
}
