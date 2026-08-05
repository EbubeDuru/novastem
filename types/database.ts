// This file is a hand-written placeholder that mirrors supabase/migrations/0001_init.sql.
// Once you've run the migration against a real Supabase project, regenerate
// the authoritative version with:
//
//   npx supabase gen types typescript --project-id <your-project-id> > types/database.ts
//
// Do not hand-edit column shapes after that point — the CLI is the source of truth.

export type OpportunityType =
  | "scholarship" | "internship" | "research" | "competition"
  | "fellowship" | "event" | "volunteer" | "certification" | "mentorship";

export type OpportunityStatus = "draft" | "pending_review" | "published" | "expired" | "rejected";
export type ReviewStatus = "pending" | "approved" | "rejected" | "needs_changes";
export type FundingType = "paid" | "unpaid" | "stipend" | "scholarship_award" | "reimbursed";
export type Difficulty = "beginner" | "intermediate" | "advanced" | "competitive";
export type SourceType = "manual" | "ai_discovery" | "organization_submitted" | "import";

export interface EligibilityRules {
  min_grade?: string;
  max_grade?: string;
  min_age?: number;
  max_age?: number;
  citizenship?: Array<"citizen" | "permanent_resident" | "visa_holder" | "international">;
  countries?: number[]; // country_id allowlist; empty/absent = any
  requires_financial_need?: boolean;
  gpa_min?: number;
  other?: string[]; // free-text requirements not yet modeled structurally
}

export interface Opportunity {
  id: string;
  organization_id: string | null;
  title: string;
  description: string;
  type: OpportunityType;
  category_id: number | null;
  pathway_id: number | null;
  is_remote: boolean;
  country_id: number | null;
  province_id: number | null;
  application_url: string;
  official_website: string | null;
  funding_type: FundingType | null;
  funding_amount_cents: number | null;
  funding_currency: string | null;
  difficulty: Difficulty | null;
  application_opens_at: string | null;
  application_deadline: string | null;
  starts_at: string | null;
  ends_at: string | null;
  eligibility_rules: EligibilityRules;
  source: SourceType;
  source_url: string | null;
  review_status: ReviewStatus;
  status: OpportunityStatus;
  extraction_confidence: number | null;
  view_count: number;
  save_count: number;
  created_at: string;
  updated_at: string;
}

// Minimal Database interface shape expected by @supabase/ssr generics.
// Replace with the CLI-generated version once the project is live.
export interface Database {
  public: {
    Tables: Record<string, { Row: Record<string, unknown> }>;
  };
}
