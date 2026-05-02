export type MegaSearchQuery = {
  id: string;
  query: string;
  domain?: "general" | "people" | "legal" | "technical" | "health" | "finance" | "osint" | "unknown";
  depth?: "quick" | "standard" | "deep";
};

export type MegaSearchSourceResult = {
  source: string;
  confidence: number;
  summary: string;
  raw?: string;
};

export type MegaSearchResult = {
  id: string;
  status: "ok" | "insufficient_evidence" | "conflicting";
  answer: string;
  sources: MegaSearchSourceResult[];
  confidence: number;
  conflicts: string[];
  gaps: string[];
  nextActions: string[];
};
