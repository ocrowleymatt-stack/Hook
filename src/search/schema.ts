export type SearchDomain =
  | "general"
  | "people"
  | "technical"
  | "legal"
  | "health"
  | "finance"
  | "work"
  | "home"
  | "osint"
  | "apps_tools"
  | "unknown";

export type SearchSourceType =
  | "web"
  | "github"
  | "local_files"
  | "api_registry"
  | "user_supplied"
  | "knowledge_base";

export type SearchPlan = {
  id: string;
  query: string;
  domain: SearchDomain;
  depth: "quick" | "standard" | "deep" | "mega";
  sources: SearchSourceType[];
  freshnessRequired: boolean;
  requiredEvidenceLevel: "low" | "medium" | "high" | "court_grade";
  safetyNotes: string[];
};

export type SearchHit = {
  sourceType: SearchSourceType;
  title: string;
  url?: string;
  excerpt: string;
  retrievedAt: string;
  confidence: number;
};

export type ValidatedSearchResult = {
  status: "ok" | "insufficient_evidence" | "conflicting" | "blocked";
  answer: string;
  hits: SearchHit[];
  citations: string[];
  confidence: number;
  conflicts: string[];
  gaps: string[];
  nextActions: string[];
};
