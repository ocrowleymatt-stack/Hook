export type SourceTrace = {
  sourceId: string;
  sourceType: "transcript" | "email" | "call_log" | "cad" | "crime_record" | "complaint" | "court_document" | "note" | "other";
  title?: string;
  date?: string;
  page?: number;
  lineStart?: number;
  lineEnd?: number;
  excerpt?: string;
};

export type EvidenceClassification =
  | "threat_to_life_or_safeguarding"
  | "crime_recording_failure"
  | "contact_management_failure"
  | "sar_data_accuracy"
  | "custody_pace_property"
  | "victims_code"
  | "equality_reasonable_adjustments"
  | "iopc_referral_failure"
  | "hidden_case_status"
  | "post_notice_continuation"
  | "damages_multiplier"
  | "other";

export type AnnexXEntry = {
  id: string;
  createdAt: string;
  classification: EvidenceClassification[];
  observedFact: string;
  reportedStatement?: string;
  inference?: string;
  legalRelevance: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  confidence: number;
  sourceTrace: SourceTrace[];
  bundleTargets: string[];
  cautions: string[];
};

export type AnnexXIngestionResult = {
  status: "ok" | "needs_review";
  entries: AnnexXEntry[];
  warnings: string[];
};
