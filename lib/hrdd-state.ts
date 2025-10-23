/**
 * HRDD State Annotation
 *
 * Defines the state structure for HRDD assessment workflow using LangGraph Annotation.
 * Extends patterns from existing search engine state management.
 */

import { Annotation } from "@langchain/langgraph";

/**
 * Dossier Input
 */
export interface Dossier {
  customer: string;
  useCase: string;
  country: string;
}

/**
 * Preliminary Screening Results
 */
export interface WeaponsCheckResult {
  prohibited: boolean;
  rationale: string;
  confidence: number;
  nuclear_chemical_biological?: { prohibited: boolean; rationale: string; confidence: number };
  cluster_munitions_mines?: { prohibited: boolean; rationale: string; confidence: number };
  autonomous_weapons?: { prohibited: boolean; rationale: string; confidence: number };
}

export interface SanctionsCheckResult {
  customer_sanctioned: boolean | "inconclusive";
  customer_sanctions_programs: string[];
  country_sanctioned: boolean | "inconclusive";
  country_sanctions_type: "comprehensive" | "targeted" | "none";
  country_sanctions_programs: string[];
  rationale: string;
  information_gaps: string[];
  confidence: number;
}

export interface JurisdictionCheckResult {
  automatic_high_risk: boolean | "inconclusive";
  un_bodies_accusations: Array<{
    body: string;
    accusation: string;
    date: string;
    citation: string;
  }>;
  international_court_cases: Array<{
    court: string;
    case: string;
    status: string;
    citation: string;
  }>;
  hr_organization_reports: Array<{
    organization: string;
    finding: string;
    date: string;
    citation: string;
  }>;
  rationale: string;
  information_gaps: string[];
  confidence: number;
}

export interface PreliminaryScreening {
  weapons: WeaponsCheckResult | null;
  sanctions: SanctionsCheckResult | null;
  jurisdiction: JurisdictionCheckResult | null;
  outcome: "PASS" | "FAIL" | null;
}

/**
 * Risk Factor Assessment Results
 */
export interface RiskFactorResult {
  level: "Low" | "Medium" | "High";
  rationale: string;
  citations: string[];  // Array of source URLs
  information_gaps: string[];
  confidence: number;
}

export interface GeographicRiskResult extends RiskFactorResult {
  eu_nato_member: boolean | null;
  freedom_house_score: number | null;
  freedom_house_rating: "Free" | "Partly Free" | "Not Free" | null;
  press_freedom_index_score: number | null;
  un_investigations: string[];
  governance_assessment: string;
  ai_governance: string;
  sanctions_status: "none" | "targeted" | "comprehensive";
}

export interface CustomerRiskResult extends RiskFactorResult {
  ungp_adoption: boolean | "unknown";
  ethics_policies_found: boolean;
  corporate_governance: "Strong" | "Moderate" | "Weak" | "Opaque";
  compliance_violations: Array<{
    violation: string;
    date: string;
    status: "Unresolved" | "Resolved";
    citation: string;
  }>;
  adverse_media_findings: Array<{
    finding: string;
    date: string;
    source: string;
    citation: string;
  }>;
  ownership_transparency: "Transparent" | "Limited" | "Opaque";
  esg_reporting: boolean;
}

export interface EndUseRiskResult extends RiskFactorResult {
  human_control_level: "High" | "Medium" | "Low";
  human_control_rationale: string;
  proximity_to_harm: "Low" | "Medium" | "High";
  proximity_rationale: string;
  repurposing_ease: "Low" | "Medium" | "High";
  repurposing_rationale: string;
  autonomous_weapons_comparison: string;
  dual_use_classification: string;
}

/**
 * Source Interface (compatible with existing search engine)
 */
export interface Source {
  url: string;
  title: string;
  content?: string;
  quality?: number;
  summary?: string;
}

/**
 * Audit Trail Entry
 */
export interface AuditEntry {
  timestamp: number;
  event: string;
  data: unknown;
}

/**
 * HRDD State Annotation
 *
 * Defines the complete state structure for the HRDD assessment workflow.
 * Uses reducers for proper state management in LangGraph.
 */
export const HRDDStateAnnotation = Annotation.Root({
  // Input fields
  dossier: Annotation<Dossier>({
    reducer: (_, y) => y ?? { customer: "", useCase: "", country: "" },
    default: () => ({ customer: "", useCase: "", country: "" })
  }),

  // Preliminary Screening Results
  preliminaryScreening: Annotation<PreliminaryScreening>({
    reducer: (_, y) => y ?? { weapons: null, sanctions: null, jurisdiction: null, outcome: null },
    default: () => ({ weapons: null, sanctions: null, jurisdiction: null, outcome: null })
  }),

  // Risk Factor Assessment Results
  geographicRisk: Annotation<GeographicRiskResult | null>({
    reducer: (_, y) => y,
    default: () => null
  }),

  customerRisk: Annotation<CustomerRiskResult | null>({
    reducer: (_, y) => y,
    default: () => null
  }),

  endUseRisk: Annotation<EndUseRiskResult | null>({
    reducer: (_, y) => y,
    default: () => null
  }),

  // Search Results (with deduplication by URL)
  sources: Annotation<Source[]>({
    reducer: (existing: Source[], update: Source[] | undefined) => {
      if (!update) return existing;
      // Deduplicate sources by URL
      const sourceMap = new Map<string, Source>();
      [...existing, ...update].forEach(source => {
        sourceMap.set(source.url, source);
      });
      return Array.from(sourceMap.values());
    },
    default: () => []
  }),

  // All executed queries
  queries: Annotation<string[]>({
    reducer: (existing: string[], update: string[] | undefined) => {
      if (!update) return existing;
      return [...existing, ...update];
    },
    default: () => []
  }),

  // Final Output
  finalReport: Annotation<string | null>({
    reducer: (_, y) => y,
    default: () => null
  }),

  overallRisk: Annotation<"Low" | "Medium" | "High" | null>({
    reducer: (_, y) => y,
    default: () => null
  }),

  // Audit Trail
  auditTrail: Annotation<AuditEntry[]>({
    reducer: (existing: AuditEntry[], update: AuditEntry[] | undefined) => {
      if (!update) return existing;
      return [...existing, ...update];
    },
    default: () => []
  }),

  // Control Fields
  rejected: Annotation<boolean>({
    reducer: (_, y) => y ?? false,
    default: () => false
  }),

  currentPhase: Annotation<string>({
    reducer: (_, y) => y ?? "preliminary-screening",
    default: () => "preliminary-screening"
  }),

  error: Annotation<string | null>({
    reducer: (_, y) => y,
    default: () => null
  }),

  errorType: Annotation<"search" | "llm" | "unknown" | null>({
    reducer: (_, y) => y,
    default: () => null
  })
});

/**
 * Type export for HRDD State
 */
export type HRDDState = typeof HRDDStateAnnotation.State;
