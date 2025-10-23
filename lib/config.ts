// Search Engine Configuration
export const SEARCH_CONFIG = {
  // Search Settings
  MAX_SEARCH_QUERIES: 24,        // Maximum number of search queries to generate
  MAX_SOURCES_PER_SEARCH: 10,     // Maximum sources to return per search query
  MAX_SOURCES_TO_SCRAPE: 20,      // Maximum sources to scrape for additional content

  // Content Processing
  MIN_CONTENT_LENGTH: 100,       // Minimum content length to consider valid
  SUMMARY_CHAR_LIMIT: 100,       // Character limit for source summaries
  CONTEXT_PREVIEW_LENGTH: 500,   // Preview length for previous context
  ANSWER_CHECK_PREVIEW: 2500,    // Content preview length for answer checking
  MAX_SOURCES_TO_CHECK: 10,      // Maximum sources to check for answers

  // Retry Logic
  MAX_RETRIES: 2,                // Maximum retry attempts for failed operations
  MAX_SEARCH_ATTEMPTS: 3,        // Maximum attempts to find answers via search
  MIN_ANSWER_CONFIDENCE: 0.3,    // Minimum confidence (0-1) that a question was answered
  EARLY_TERMINATION_CONFIDENCE: 0.8, // Confidence level to skip additional searches

  // Timeouts
  SCRAPE_TIMEOUT: 15000,         // Timeout for scraping operations (ms)

  // Performance
  SOURCE_ANIMATION_DELAY: 50,    // Delay between source animations (ms) - reduced from 150
  PARALLEL_SUMMARY_GENERATION: true, // Generate summaries in parallel
} as const;

// You can also export individual configs for different components
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,       // Default animation duration (ms)
  SOURCE_FADE_DELAY: 50,         // Delay between source animations (ms)
  MESSAGE_CYCLE_DELAY: 2000,     // Delay for cycling through messages (ms)
} as const;

// Model Configuration
export const MODEL_CONFIG = {
  FAST_MODEL: "gpt-4o-mini",     // Fast model for quick operations
  QUALITY_MODEL: "gpt-4o",       // High-quality model for final synthesis
  TEMPERATURE: 0,                // Model temperature (0 = deterministic)
} as const;

// Multi-Pass Synthesis Configuration
export const SYNTHESIS_CONFIG = {
  // Multi-pass control
  ENABLE_MULTI_PASS: true,       // Enable multi-pass synthesis pipeline

  // Context limits (increased from 100k for GPT-4o's 128k token capacity)
  MAX_TOTAL_CHARS: 400000,       // Maximum total characters for synthesis (4x increase)
  MAX_CHARS_PER_SOURCE: 30000,   // Maximum characters per source (2x increase)
  MIN_CHARS_PER_SOURCE: 5000,    // Minimum characters per source (2.5x increase)

  // Pass configuration
  PASS_1_SUMMARY_COUNT: -1,      // All sources (use summaries) in Pass 1
  PASS_2_FULL_CONTENT_COUNT: 50, // Top 50 sources (use full content) in Pass 2
  PASS_3_CROSS_REF_COUNT: 30,    // Top 30 sources for cross-reference validation

  // Quality requirements
  MIN_CITATIONS_PER_SECTION: 3,  // Minimum citations required per major section
  MIN_TOTAL_CITATIONS: 50,       // Minimum total unique citations in final report
  TARGET_REPORT_LENGTH: 7500,    // Target report length in words (~5-10k words)

  // Features
  ENABLE_CROSS_REFERENCE: true,  // Enable cross-reference validation in Pass 3
  ENABLE_FACT_CHECKING: true,    // Enable fact checking across sources
  ENABLE_CONFLICT_DETECTION: true, // Enable detection of conflicting information
  CONFIDENCE_THRESHOLD: 0.7,     // Minimum confidence threshold for findings

  // Model settings for synthesis
  OVERVIEW_MODEL: "gpt-4o-mini", // Pass 1 model (cost-effective)
  DEEPDIVE_MODEL: "gpt-4o",      // Pass 2-4 model (high quality)
} as const;
