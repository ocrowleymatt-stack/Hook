import { MediaType } from "./schema.js";

export type RenderTarget =
  | "markdown"
  | "html"
  | "docx"
  | "pdf"
  | "pptx"
  | "image"
  | "audio"
  | "video"
  | "json";

export type RenderJob = {
  id: string;
  assetId: string;
  mediaType: MediaType;
  target: RenderTarget;
  title: string;
  input: unknown;
  renderer: "internal_plan" | "external_api" | "manual_review";
  requiredSecrets: string[];
  status: "planned" | "ready" | "blocked";
  blockingIssues: string[];
};

export type RenderPackage = {
  id: string;
  jobs: RenderJob[];
  deliveryChecklist: string[];
  warnings: string[];
};
