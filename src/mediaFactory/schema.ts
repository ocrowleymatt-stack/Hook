export type MediaType =
  | "text"
  | "markdown"
  | "json"
  | "html"
  | "docx_plan"
  | "pdf_plan"
  | "slides_plan"
  | "image_prompt"
  | "audio_script"
  | "video_brief"
  | "social_pack"
  | "web_page"
  | "data_visualisation_plan";

export type MediaRequest = {
  id: string;
  objective: string;
  audience?: string;
  sourceContent: string;
  requiredMedia?: MediaType[];
  autoSelectMedia?: boolean;
  brandTone?: string;
  qualityStandard?: "good" | "expert" | "world_class";
  constraints?: string[];
};

export type MediaAssetPlan = {
  id: string;
  type: MediaType;
  title: string;
  purpose: string;
  recommended: boolean;
  rationale: string;
  productionNotes: string[];
  qualityChecks: string[];
  output: unknown;
};

export type MediaFactoryOutput = {
  id: string;
  status: "ready" | "needs_more_input" | "blocked";
  selectedMedia: MediaType[];
  assets: MediaAssetPlan[];
  editorialNotes: string[];
  risks: string[];
  nextActions: string[];
};
