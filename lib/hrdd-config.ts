/**
 * HRDD (Human Rights Due Diligence) Configuration
 *
 * This module defines configuration constants for the HRDD assessment workflow,
 * including model settings, workflow parameters, and risk classification thresholds.
 */

// Model Configuration for HRDD Assessments
export const HRDD_MODEL_CONFIG = {
  MODEL: "gpt-4o",           // Use GPT-4o for all HRDD phases (accuracy critical for compliance)
  TEMPERATURE: 0,            // Deterministic outputs for consistency
  MAX_TOKENS: 4096,          // Sufficient for structured outputs
} as const;

// Workflow Configuration
export const HRDD_WORKFLOW_CONFIG = {
  // Timeouts
  PROCESSING_TIMEOUT: 3600000,  // 1 hour processing timeout (in milliseconds)
  SEARCH_TIMEOUT: 30000,        // 30 seconds per search operation
  LLM_TIMEOUT: 60000,           // 60 seconds per LLM call

  // Phase Names
  PHASES: {
    PRELIMINARY_SCREENING: "preliminary-screening",
    GEOGRAPHIC_CONTEXT: "geographic-context",
    CUSTOMER_PROFILE: "customer-profile",
    END_USE_APPLICATION: "end-use-application",
    SYNTHESIS: "synthesis",
  } as const,

  // Event Types
  EVENT_TYPES: {
    PHASE_UPDATE: "hrdd-phase",
    PRELIMINARY_RESULT: "preliminary-result",
    RISK_CLASSIFICATION: "risk-classification",
    SEARCHING: "searching",
    FOUND: "found",
    SOURCE_PROCESSING: "source-processing",
    SOURCE_COMPLETE: "source-complete",
    CONTENT_CHUNK: "content-chunk",
    FINAL_RESULT: "final-result",
    ERROR: "error",
  } as const,

  // Search Configuration
  MAX_QUERIES_PER_FACTOR: 20,   // Maximum queries per risk factor
  MAX_SOURCES_PER_QUERY: 10,    // Maximum sources per query
  MAX_RETRIES: 3,               // Maximum retry attempts for failed operations
} as const;

/**
 * Risk Classification Thresholds
 *
 * These thresholds are based on the HRDD Guide Annex 3 and are used
 * to classify risk levels for each assessment factor.
 */
export const HRDD_RISK_THRESHOLDS = {
  // Geographic Context Thresholds
  GEOGRAPHIC: {
    FREEDOM_HOUSE: {
      LOW: 70,      // Score > 70 = Low risk (Free)
      HIGH: 40,     // Score < 40 = High risk (Not Free)
      // Score 40-70 = Medium risk (Partly Free)
    },
    PRESS_FREEDOM: {
      LOW: 60,      // Score > 60 = Low risk
      HIGH: 30,     // Score < 30 = High risk
      // Score 30-60 = Medium risk
    },
  },

  // Customer Profile Thresholds
  CUSTOMER: {
    VIOLATION_RECENCY: {
      RECENT: 3,    // Violations within past 3 years = High risk
      RESOLVED: 3,  // Violations > 3 years ago (resolved) = Medium risk
    },
  },

  // Risk Level Classifications
  RISK_LEVELS: {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
  } as const,
} as const;

/**
 * Source Priority Levels
 *
 * Defines priority levels for authoritative sources.
 * Critical sources must succeed or prominently flag failure.
 */
export const SOURCE_PRIORITY = {
  CRITICAL: "critical",  // Must succeed or flag failure prominently
  HIGH: "high",          // Important for comprehensive assessment
  MEDIUM: "medium",      // Supplementary information
  LOW: "low",            // Nice-to-have context
} as const;

/**
 * Search Strategies
 *
 * Defines strategies for searching different types of sources.
 */
export const SEARCH_STRATEGY = {
  SITE_SPECIFIC: "site-specific",  // Use site: operator for domain-specific searches
  BROADER_WEB: "broader-web",      // General web search
} as const;

// Type exports for TypeScript type safety
export type HRDDPhase = typeof HRDD_WORKFLOW_CONFIG.PHASES[keyof typeof HRDD_WORKFLOW_CONFIG.PHASES];
export type HRDDEventType = typeof HRDD_WORKFLOW_CONFIG.EVENT_TYPES[keyof typeof HRDD_WORKFLOW_CONFIG.EVENT_TYPES];
export type RiskLevel = typeof HRDD_RISK_THRESHOLDS.RISK_LEVELS[keyof typeof HRDD_RISK_THRESHOLDS.RISK_LEVELS];
export type SourcePriority = typeof SOURCE_PRIORITY[keyof typeof SOURCE_PRIORITY];
export type SearchStrategy = typeof SEARCH_STRATEGY[keyof typeof SEARCH_STRATEGY];
