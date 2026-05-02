export type DocumentPurpose =
  | "court_bundle"
  | "witness_statement"
  | "legal_letter"
  | "report"
  | "briefing"
  | "proposal"
  | "book_chapter"
  | "marketing_page"
  | "technical_spec"
  | "unknown";

export type LayoutCandidate = {
  id: string;
  name: string;
  purpose: DocumentPurpose;
  sections: string[];
  strengths: string[];
  risks: string[];
  bestFor: string[];
  confidence: number;
};

export type EditorialStandard = {
  register: "court_safe" | "executive" | "literary" | "technical" | "commercial";
  tone: string;
  rules: string[];
  bannedPatterns: string[];
  requiredChecks: string[];
};

export type DocumentCraftRequest = {
  id: string;
  title: string;
  purpose: DocumentPurpose;
  rawContent: string;
  audience?: string;
  jurisdiction?: string;
  desiredTone?: string;
  outputFormat?: "markdown" | "json" | "html" | "docx_plan" | "pdf_plan";
};

export type CraftedDocument = {
  id: string;
  selectedLayout: LayoutCandidate;
  editorialStandard: EditorialStandard;
  document: string;
  sectionMap: Array<{ section: string; purpose: string; contentSummary: string }>;
  qualityReport: {
    status: "pass" | "needs_review" | "fail";
    strengths: string[];
    issues: string[];
    missingInputs: string[];
  };
};
