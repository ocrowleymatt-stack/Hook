export type HookInput = Record<string, unknown>;

export type HookResult = {
  ok: boolean;
  hook: string;
  output?: unknown;
  error?: string;
};

export type Hook = {
  name: string;
  description: string;
  trigger: string;
  handler: (input: HookInput) => Promise<HookResult>;
};

export type HookDecision = {
  hook: string;
  reason: string;
  confidence: number;
  payload: HookInput;
};

export type EventEnvelope = {
  type: string;
  source?: string;
  text?: string;
  payload?: HookInput;
};
