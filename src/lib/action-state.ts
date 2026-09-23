export type ActionState =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };
