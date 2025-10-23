/**
 * Multi-Pass Synthesis Engine
 *
 * Orchestrates 4-pass synthesis pipeline:
 * - Pass 1: Overview generation from summaries
 * - Pass 2: Deep dive with full content retrieval
 * - Pass 3: Cross-reference and validation
 * - Pass 4: Final report generation
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Source } from './langgraph-search-engine';
import { IContentStore } from './content-store';
import { SYNTHESIS_CONFIG, MODEL_CONFIG } from './config';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Outline structure generated in Pass 1
 */
export interface OutlineStructure {
  sections: OutlineSection[];
  overallTheme: string;
}

export interface OutlineSection {
  id: string;
  title: string;
  description: string;
  relevantSources: Array<{ url: string; relevanceScore: number }>;
  subsections?: Array<{ title: string; relevantSources: string[] }>;
}

/**
 * Section findings from Pass 2 deep dive
 */
export interface SectionFindings {
  sectionId: string;
  findings: Finding[];
  sourcesUsed: string[]; // URLs of sources cited in this section
}

export interface Finding {
  claim: string;
  citations: string[]; // source URLs
  confidence: number; // 0.0-1.0
  evidence: string; // extracted quote or data
}

/**
 * Validation report from Pass 3
 */
export interface ValidationReport {
  validatedFindings: ValidatedFinding[];
  conflicts: ConflictReport[];
  informationGaps: string[];
}

export interface ValidatedFinding {
  originalFinding: Finding;
  updatedConfidence: number;
  supportingSources: string[];
  conflictDetected: boolean;
  conflictDetails?: ConflictReport;
}

export interface ConflictReport {
  claim: string;
  viewpoint1: { claim: string; citations: string[] };
  viewpoint2: { claim: string; citations: string[] };
  resolution: 'present_both' | 'favor_viewpoint1' | 'favor_viewpoint2';
}

// ============================================================================
// Pass 1: Overview Generation
// ============================================================================

/**
 * Prompt template for Pass 1 outline generation
 */
const PASS1_OVERVIEW_PROMPT = `You are analyzing source summaries to create a structured outline for a comprehensive research report.

TASK:
1. Identify 5-8 major themes across all sources
2. Create a structured outline with sections and subsections
3. Map which sources support each section (use source URLs)
4. Assign relevance scores (0.0-1.0) for each source-to-section mapping

OUTPUT FORMAT (JSON):
{
  "sections": [
    {
      "id": "section_1",
      "title": "Main Theme 1",
      "description": "Brief description of what this section covers",
      "relevantSources": [
        { "url": "https://...", "relevanceScore": 0.9 },
        { "url": "https://...", "relevanceScore": 0.7 }
      ],
      "subsections": [
        { "title": "Subtopic A", "relevantSources": ["url1", "url2"] }
      ]
    }
  ],
  "overallTheme": "One sentence describing the overarching narrative"
}

GUIDELINES:
- Each section should have 5-15 relevant sources
- Relevance scores: 0.9+ (highly relevant), 0.7-0.9 (relevant), 0.5-0.7 (somewhat relevant)
- Subsections are optional but recommended for complex themes
- Focus on themes that can be supported by multiple sources (avoid single-source sections)`;

/**
 * Generate outline from source summaries (Pass 1)
 *
 * @param query - Original user query
 * @param sources - Sources with summaries in content field
 * @param context - Optional conversation context
 * @returns Structured outline with source mappings
 */
export async function generateOutline(
  query: string,
  sources: Source[],
  context?: Array<{ query: string; response: string }>
): Promise<OutlineStructure> {
  // Initialize LLM for Pass 1 (cost-effective model)
  const llm = new ChatOpenAI({
    modelName: SYNTHESIS_CONFIG.OVERVIEW_MODEL,
    temperature: MODEL_CONFIG.TEMPERATURE,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Concatenate all source summaries
  const summaries = sources
    .filter(s => s.content && s.content.length > 0)
    .map((s, idx) => `[${idx + 1}] URL: ${s.url}\nTitle: ${s.title}\nSummary: ${s.content}`)
    .join('\n\n');

  // Build context section if available
  const contextSection = context && context.length > 0
    ? `\n\nPREVIOUS CONTEXT:\n${context.map(c => `Q: ${c.query}\nA: ${c.response.slice(0, 500)}...`).join('\n\n')}`
    : '';

  // Construct prompt
  const userPrompt = `QUERY: ${query}${contextSection}

SOURCE SUMMARIES (${sources.length} sources):
${summaries}

${PASS1_OVERVIEW_PROMPT}`;

  try {
    // Call LLM
    const response = await llm.invoke([
      new SystemMessage('You are a research analyst creating structured outlines from source summaries.'),
      new HumanMessage(userPrompt)
    ]);

    // Parse JSON response
    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    const outline: OutlineStructure = JSON.parse(jsonContent);

    // Validate outline structure
    if (!outline.sections || !Array.isArray(outline.sections)) {
      throw new Error('Invalid outline structure: missing sections array');
    }

    // Ensure all sections have required fields
    outline.sections.forEach((section, idx) => {
      if (!section.id) section.id = `section_${idx + 1}`;
      if (!section.relevantSources) section.relevantSources = [];
      if (!section.subsections) section.subsections = [];
    });

    return outline;
  } catch (error) {
    console.error('Error generating outline:', error);

    // Return fallback outline
    return {
      sections: [
        {
          id: 'section_1',
          title: 'Overview',
          description: `Analysis of ${query}`,
          relevantSources: sources.slice(0, 10).map(s => ({ url: s.url, relevanceScore: 0.5 })),
          subsections: []
        }
      ],
      overallTheme: `Research findings on ${query}`
    };
  }
}

// ============================================================================
// Pass 2: Deep Dive Analysis
// ============================================================================

/**
 * Prompt template for Pass 2 deep dive
 */
const PASS2_DEEPDIVE_PROMPT = `You are extracting detailed findings from source content for a specific section of a research report.

TASK:
1. Extract 10-20 specific findings relevant to this section
2. Each finding must include:
   - Clear claim statement
   - Direct evidence (quote or data) from source content
   - Citation (source URL)
   - Confidence score (0.0-1.0)
3. Prioritize findings supported by multiple sources
4. Include specific numbers, dates, names when available

OUTPUT FORMAT (JSON):
{
  "findings": [
    {
      "claim": "Specific factual claim",
      "citations": ["https://source1.com", "https://source2.com"],
      "confidence": 0.9,
      "evidence": "Direct quote or data point from source content"
    }
  ]
}

CONFIDENCE SCORING:
- 0.9-1.0: Multiple authoritative sources agree
- 0.7-0.9: Single authoritative source or multiple general sources
- 0.5-0.7: Single general source or indirect evidence
- <0.5: Speculative or weak evidence

GUIDELINES:
- Cite EVERY claim with source URLs
- Extract exact quotes when possible (use "quotation marks")
- Include recency indicators for time-sensitive info (e.g., "as of 2024")
- If sources conflict, note that in claim (will be handled in Pass 3)`;

/**
 * Process a single section with full content retrieval (Pass 2)
 *
 * @param section - Section from Pass 1 outline
 * @param contentStore - Content store with full source content
 * @param allSources - All available sources
 * @returns Section findings with citations
 */
export async function processSection(
  section: OutlineSection,
  contentStore: IContentStore,
  allSources: Source[]
): Promise<SectionFindings> {
  // Initialize LLM for Pass 2 (high quality model)
  const llm = new ChatOpenAI({
    modelName: SYNTHESIS_CONFIG.DEEPDIVE_MODEL,
    temperature: MODEL_CONFIG.TEMPERATURE,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Select top N sources for this section by relevance score
  const topSources = section.relevantSources
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, SYNTHESIS_CONFIG.PASS_2_FULL_CONTENT_COUNT);

  // Retrieve full content from ContentStore
  const urls = topSources.map(s => s.url);
  const fullContentMap = contentStore.retrieveBatch(urls);

  // Build prompt with full content
  let fullContentText = '';
  let totalChars = 0;
  const sourcesUsed: string[] = [];

  for (const [url, content] of fullContentMap) {
    // Truncate to MAX_CHARS_PER_SOURCE
    const truncated = content.slice(0, SYNTHESIS_CONFIG.MAX_CHARS_PER_SOURCE);

    // Find source title
    const source = allSources.find(s => s.url === url);
    const title = source?.title || url;

    fullContentText += `\n\n--- SOURCE: ${url} ---\nTitle: ${title}\n${truncated}`;
    totalChars += truncated.length;
    sourcesUsed.push(url);

    // Stop if approaching token limit (80% of MAX_TOTAL_CHARS)
    if (totalChars > SYNTHESIS_CONFIG.MAX_TOTAL_CHARS * 0.8) break;
  }

  // If no full content available, fall back to summaries
  if (fullContentMap.size === 0) {
    console.warn(`No full content found for section ${section.id}, using summaries`);
    urls.forEach(url => {
      const source = allSources.find(s => s.url === url);
      if (source?.content) {
        fullContentText += `\n\n--- SOURCE: ${url} ---\nTitle: ${source.title}\nSummary: ${source.content}`;
        sourcesUsed.push(url);
      }
    });
  }

  // Construct prompt
  const userPrompt = `SECTION: ${section.title}
DESCRIPTION: ${section.description}

FULL CONTENT FROM TOP SOURCES (${sourcesUsed.length} sources, ~${totalChars} chars):
${fullContentText}

${PASS2_DEEPDIVE_PROMPT}`;

  try {
    // Call LLM
    const response = await llm.invoke([
      new SystemMessage('You are a research analyst extracting detailed findings from source content.'),
      new HumanMessage(userPrompt)
    ]);

    // Parse JSON response
    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    const result = JSON.parse(jsonContent);

    return {
      sectionId: section.id,
      findings: result.findings || [],
      sourcesUsed
    };
  } catch (error) {
    console.error(`Error processing section ${section.id}:`, error);

    // Return empty findings on error
    return {
      sectionId: section.id,
      findings: [],
      sourcesUsed
    };
  }
}

// ============================================================================
// Pass 3: Cross-Reference and Validation
// ============================================================================

/**
 * Prompt template for Pass 3 cross-reference and validation
 */
const PASS3_CROSSREF_PROMPT = `You are validating research findings by cross-referencing multiple sources.

TASK:
1. For each finding, check if additional sources support or contradict it
2. Upgrade confidence if multiple sources agree
3. Flag conflicts when sources significantly disagree
4. Identify which questions couldn't be answered from sources

OUTPUT FORMAT (JSON):
{
  "validatedFindings": [
    {
      "findingId": "finding_1",
      "updatedConfidence": 0.95,
      "supportingSources": ["url3", "url4"],
      "conflictDetected": false
    },
    {
      "findingId": "finding_2",
      "updatedConfidence": 0.6,
      "conflictDetected": true,
      "conflictDetails": {
        "claim": "Main claim in question",
        "viewpoint1": { "claim": "X says A", "citations": ["url1"] },
        "viewpoint2": { "claim": "Y says B", "citations": ["url2"] },
        "resolution": "present_both"
      }
    }
  ],
  "informationGaps": [
    "Couldn't find information about specific timeline",
    "No sources addressed the cost implications"
  ]
}

CONFLICT DETECTION:
- Flag conflict if sources provide contradictory facts or numbers
- Flag conflict if one source says "yes" and another says "no"
- Do NOT flag different perspectives/opinions as conflicts
- Resolution strategy: "present_both" (show both viewpoints with citations)

CONFIDENCE UPGRADES:
- If 3+ sources agree: upgrade to 0.95
- If 2 sources agree: upgrade to 0.85
- If only 1 source but authoritative: keep at 0.75
- If sources conflict: downgrade to 0.6`;

/**
 * Validate findings by cross-referencing sources (Pass 3)
 *
 * @param deepDiveFindings - All findings from Pass 2
 * @param contentStore - Content store for additional sources
 * @param allSources - All available sources
 * @returns Validation report with conflicts and information gaps
 */
export async function validateFindings(
  deepDiveFindings: SectionFindings[],
  contentStore: IContentStore,
  allSources: Source[]
): Promise<ValidationReport> {
  // Initialize LLM for Pass 3 (high quality model)
  const llm = new ChatOpenAI({
    modelName: SYNTHESIS_CONFIG.DEEPDIVE_MODEL,
    temperature: MODEL_CONFIG.TEMPERATURE,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Aggregate all findings for validation
  const allFindings = deepDiveFindings.flatMap(sf => sf.findings);

  // Serialize findings for prompt
  const findingsText = allFindings
    .map((f, idx) => `[Finding ${idx + 1}]
Claim: ${f.claim}
Citations: ${f.citations.join(', ')}
Confidence: ${f.confidence}
Evidence: ${f.evidence}`)
    .join('\n\n');

  // Select top N sources for cross-reference (those not heavily used in Pass 2)
  const usedUrls = new Set(deepDiveFindings.flatMap(sf => sf.sourcesUsed));
  const additionalSources = allSources
    .filter(s => !usedUrls.has(s.url))
    .slice(0, SYNTHESIS_CONFIG.PASS_3_CROSS_REF_COUNT);

  // Retrieve additional content for cross-reference
  const additionalUrls = additionalSources.map(s => s.url);
  const additionalContentMap = contentStore.retrieveBatch(additionalUrls);

  let additionalContentText = '';
  let totalChars = 0;

  for (const [url, content] of additionalContentMap) {
    const truncated = content.slice(0, SYNTHESIS_CONFIG.MAX_CHARS_PER_SOURCE);
    const source = allSources.find(s => s.url === url);
    const title = source?.title || url;

    additionalContentText += `\n\n--- SOURCE: ${url} ---\nTitle: ${title}\n${truncated}`;
    totalChars += truncated.length;

    // Stop if approaching token limit
    if (totalChars > SYNTHESIS_CONFIG.MAX_TOTAL_CHARS * 0.5) break;
  }

  // If no additional content, use summaries
  if (additionalContentMap.size === 0) {
    additionalSources.forEach(source => {
      if (source.content) {
        additionalContentText += `\n\n--- SOURCE: ${source.url} ---\nTitle: ${source.title}\nSummary: ${source.content}`;
      }
    });
  }

  // Construct prompt
  const userPrompt = `FINDINGS TO VALIDATE (from Pass 2):
${findingsText}

ADDITIONAL SOURCES FOR CROSS-REFERENCE (${additionalUrls.length} sources):
${additionalContentText}

${PASS3_CROSSREF_PROMPT}`;

  try {
    // Call LLM
    const response = await llm.invoke([
      new SystemMessage('You are a research analyst validating findings by cross-referencing multiple sources.'),
      new HumanMessage(userPrompt)
    ]);

    // Parse JSON response
    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    const result = JSON.parse(jsonContent);

    // Map validated findings back to original findings
    const validatedFindings: ValidatedFinding[] = [];
    const conflicts: ConflictReport[] = [];

    (result.validatedFindings || []).forEach((vf: any, idx: number) => {
      const originalFinding = allFindings[idx];
      if (!originalFinding) return;

      const validated: ValidatedFinding = {
        originalFinding,
        updatedConfidence: vf.updatedConfidence || originalFinding.confidence,
        supportingSources: vf.supportingSources || [],
        conflictDetected: vf.conflictDetected || false,
        conflictDetails: vf.conflictDetails,
      };

      validatedFindings.push(validated);

      if (vf.conflictDetected && vf.conflictDetails) {
        conflicts.push(vf.conflictDetails);
      }
    });

    return {
      validatedFindings,
      conflicts,
      informationGaps: result.informationGaps || [],
    };
  } catch (error) {
    console.error('Error validating findings:', error);

    // Return findings without validation on error
    const validatedFindings: ValidatedFinding[] = allFindings.map(f => ({
      originalFinding: f,
      updatedConfidence: f.confidence,
      supportingSources: [],
      conflictDetected: false,
    }));

    return {
      validatedFindings,
      conflicts: [],
      informationGaps: [],
    };
  }
}

// ============================================================================
// Pass 4: Final Report Generation
// ============================================================================

/**
 * Prompt template for Pass 4 final report
 */
const PASS4_FINAL_REPORT_PROMPT = `You are synthesizing validated research findings into a comprehensive report.

TASK:
Generate a comprehensive research report in markdown format following this structure:

# {Query Title}

## Executive Summary
- 3-5 bullet points summarizing key findings
- Overall theme/conclusion

{For each section in outline:}
## {Section Title}

{Section content with:}
- Multiple paragraphs covering findings
- Minimum 3 citations per major claim using [url] format
- Confidence indicators for key claims: (High confidence), (Medium confidence), (Low confidence)
- Conflicting information presented as: "Source A reports X [url1], while Source B reports Y [url2]"
- Specific data, quotes, dates included

{End sections}

## Information Gaps

{List gaps from Pass 3:}
- Gap 1 description
- Gap 2 description

## Confidence Assessment

{For major findings:}
- Finding X: High confidence (0.95) - Supported by 5 authoritative sources
- Finding Y: Medium confidence (0.70) - Supported by 2 sources, limited data available

FORMATTING RULES:
1. Use markdown: ##, ###, **, -, \`code\`
2. Every factual claim must have citation [url]
3. Include confidence indicators where relevant
4. Present conflicts transparently (don't hide disagreements)
5. Use specific numbers, dates, names (not vague terms)
6. Target length: 5,000-10,000 words
7. Ensure 50+ unique citations distributed across report

TONE:
- Professional, objective, evidence-based
- Clear and accessible (avoid jargon unless necessary)
- Transparent about limitations and conflicts`;

/**
 * Generate final comprehensive report (Pass 4)
 *
 * @param outline - Outline structure from Pass 1
 * @param validationReport - Validation report from Pass 3
 * @param query - Original user query
 * @param onChunk - Callback for streaming chunks
 * @param context - Optional conversation context
 * @returns Final markdown report
 */
export async function generateFinalReport(
  outline: OutlineStructure,
  validationReport: ValidationReport,
  query: string,
  onChunk: (chunk: string) => void,
  context?: Array<{ query: string; response: string }>
): Promise<string> {
  // Initialize streaming LLM for Pass 4
  const llm = new ChatOpenAI({
    modelName: SYNTHESIS_CONFIG.DEEPDIVE_MODEL,
    temperature: MODEL_CONFIG.TEMPERATURE,
    openAIApiKey: process.env.OPENAI_API_KEY,
    streaming: true,
  });

  // Build outline summary
  const outlineSummary = outline.sections
    .map(s => `- ${s.title}: ${s.description}`)
    .join('\n');

  // Build validated findings summary
  const findingsSummary = validationReport.validatedFindings
    .map((vf, idx) => `[Finding ${idx + 1}]
Claim: ${vf.originalFinding.claim}
Confidence: ${vf.updatedConfidence}
Citations: ${vf.originalFinding.citations.join(', ')}
Evidence: ${vf.originalFinding.evidence}
${vf.conflictDetected ? `CONFLICT DETECTED: ${JSON.stringify(vf.conflictDetails)}` : ''}`)
    .join('\n\n');

  // Build conflicts summary
  const conflictsSummary = validationReport.conflicts.length > 0
    ? validationReport.conflicts
        .map(c => `- ${c.claim}
  Viewpoint 1: ${c.viewpoint1.claim} [${c.viewpoint1.citations.join(', ')}]
  Viewpoint 2: ${c.viewpoint2.claim} [${c.viewpoint2.citations.join(', ')}]`)
        .join('\n')
    : 'No conflicts detected';

  // Build information gaps summary
  const gapsSummary = validationReport.informationGaps.length > 0
    ? validationReport.informationGaps.map(g => `- ${g}`).join('\n')
    : 'All major questions were addressed by sources';

  // Build context section
  const contextSection = context && context.length > 0
    ? `\n\nPREVIOUS CONTEXT:\n${context.map(c => `Q: ${c.query}\nA: ${c.response.slice(0, 500)}...`).join('\n\n')}`
    : '';

  // Construct prompt
  const userPrompt = `QUERY: ${query}${contextSection}

OUTLINE:
${outlineSummary}

OVERALL THEME: ${outline.overallTheme}

VALIDATED FINDINGS:
${findingsSummary}

CONFLICTS DETECTED:
${conflictsSummary}

INFORMATION GAPS:
${gapsSummary}

${PASS4_FINAL_REPORT_PROMPT}`;

  try {
    let fullReport = '';

    // Stream the response
    const stream = await llm.stream([
      new SystemMessage('You are a research analyst synthesizing validated findings into comprehensive reports.'),
      new HumanMessage(userPrompt)
    ]);

    for await (const chunk of stream) {
      const content = typeof chunk.content === 'string' ? chunk.content : '';
      fullReport += content;
      onChunk(content);
    }

    return fullReport;
  } catch (error) {
    console.error('Error generating final report:', error);

    // Return fallback report
    const fallbackReport = `# ${query}

## Error

An error occurred while generating the comprehensive report. Please try again.

### Outline
${outlineSummary}

### Key Findings
${validationReport.validatedFindings.length} findings were validated.

### Information Gaps
${gapsSummary}`;

    onChunk(fallbackReport);
    return fallbackReport;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Select top N sources per section for deep dive
 *
 * @param sources - All processed sources
 * @param outline - Outline structure from Pass 1
 * @param N - Number of top sources to select per section
 * @returns Map of section ID to top sources
 */
export function selectTopSourcesPerSection(
  sources: Source[],
  outline: OutlineStructure,
  N: number = SYNTHESIS_CONFIG.PASS_2_FULL_CONTENT_COUNT
): Map<string, Source[]> {
  const sectionSources = new Map<string, Source[]>();

  outline.sections.forEach(section => {
    // Get sources relevant to this section
    const relevantSources = sources
      .filter(s => section.relevantSources.some(rs => rs.url === s.url))
      .sort((a, b) => {
        const scoreA = section.relevantSources.find(rs => rs.url === a.url)?.relevanceScore || 0;
        const scoreB = section.relevantSources.find(rs => rs.url === b.url)?.relevanceScore || 0;
        return scoreB - scoreA;
      })
      .slice(0, N);

    sectionSources.set(section.id, relevantSources);
  });

  return sectionSources;
}
