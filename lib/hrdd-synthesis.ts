/**
 * HRDD Report Synthesis
 *
 * Generates the final structured HRDD assessment report in markdown format.
 */

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { HRDDState, AuditEntry } from "./hrdd-state";
import { FINAL_REPORT_GENERATION_PROMPT } from "./hrdd-prompts";
import { HRDD_MODEL_CONFIG, HRDD_WORKFLOW_CONFIG } from "./hrdd-config";

// Define config type for event callbacks
interface GraphConfig {
  configurable?: {
    eventCallback?: (event: HRDDEvent) => void;
  };
}

// Event types for HRDD workflow
export type HRDDEvent =
  | { type: 'hrdd-phase'; phase: string; message: string }
  | { type: 'content-chunk'; chunk: string }
  | { type: 'final-result'; content: string; sources: { url: string; title: string }[]; followUpQuestions?: string[] }
  | { type: 'error'; error: string; errorType?: string };

/**
 * Calculate Overall Risk Level
 *
 * Overall risk = highest of the three risk factors
 */
function calculateOverallRisk(state: HRDDState): "Low" | "Medium" | "High" {
  const riskLevels: ("Low" | "Medium" | "High")[] = [];

  if (state.geographicRisk) {
    riskLevels.push(state.geographicRisk.level);
  }

  if (state.customerRisk) {
    riskLevels.push(state.customerRisk.level);
  }

  if (state.endUseRisk) {
    riskLevels.push(state.endUseRisk.level);
  }

  // Determine highest risk level
  if (riskLevels.includes("High")) {
    return "High";
  } else if (riskLevels.includes("Medium")) {
    return "Medium";
  } else {
    return "Low";
  }
}

/**
 * Get Current Date String
 */
function getCurrentDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Report Synthesis Node
 *
 * Synthesizes all findings into a comprehensive HRDD assessment report.
 */
export async function synthesizeReport(
  state: HRDDState,
  config?: GraphConfig
): Promise<Partial<HRDDState>> {
  const eventCallback = config?.configurable?.eventCallback;

  if (eventCallback) {
    eventCallback({
      type: 'hrdd-phase',
      phase: HRDD_WORKFLOW_CONFIG.PHASES.SYNTHESIS,
      message: 'Synthesizing final HRDD assessment report...'
    });
  }

  try {
    // Calculate overall risk level
    const overallRisk = calculateOverallRisk(state);

    // Prepare input data for report generation
    const preliminaryScreeningData = JSON.stringify({
      weapons: state.preliminaryScreening.weapons,
      sanctions: state.preliminaryScreening.sanctions,
      jurisdiction: state.preliminaryScreening.jurisdiction,
      outcome: state.preliminaryScreening.outcome
    }, null, 2);

    const geographicRiskData = state.geographicRisk ? JSON.stringify(state.geographicRisk, null, 2) : "No data available";
    const customerRiskData = state.customerRisk ? JSON.stringify(state.customerRisk, null, 2) : "No data available";
    const endUseRiskData = state.endUseRisk ? JSON.stringify(state.endUseRisk, null, 2) : "No data available";

    // Deduplicate sources and create citation list
    const uniqueSources = Array.from(
      new Map(state.sources.map(s => [s.url, s])).values()
    );

    const sourcesData = uniqueSources.map((s, idx) => ({
      id: idx + 1,
      title: s.title,
      url: s.url
    }));

    // Prepare prompt with all data
    const prompt = FINAL_REPORT_GENERATION_PROMPT
      .replace('{customer}', state.dossier.customer)
      .replace('{useCase}', state.dossier.useCase)
      .replace('{country}', state.dossier.country)
      .replace('{preliminaryScreening}', preliminaryScreeningData)
      .replace('{geographicRisk}', geographicRiskData)
      .replace('{customerRisk}', customerRiskData)
      .replace('{endUseRisk}', endUseRiskData)
      .replace('{sources}', JSON.stringify(sourcesData, null, 2))
      .replace('{current_date}', getCurrentDate());

    // Initialize streaming LLM
    const streamingLlm = new ChatOpenAI({
      modelName: HRDD_MODEL_CONFIG.MODEL,
      temperature: HRDD_MODEL_CONFIG.TEMPERATURE,
      streaming: true,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const messages = [
      new SystemMessage(prompt),
      new HumanMessage(`Generate the complete HRDD assessment report.

Additional context:
- Overall Risk Level: ${overallRisk}
- Preliminary Screening Outcome: ${state.preliminaryScreening.outcome}
- Rejected Status: ${state.rejected ? "YES - Include REJECTION NOTICE" : "NO"}

Ensure EVERY factual claim has inline citations [1], [2], etc. matching the sources list.`)
    ];

    let fullReport = '';

    // Stream the response
    const stream = await streamingLlm.stream(messages);

    for await (const chunk of stream) {
      const content = chunk.content;
      if (typeof content === 'string') {
        fullReport += content;
        if (eventCallback) {
          eventCallback({
            type: 'content-chunk',
            chunk: content
          });
        }
      }
    }

    // Create audit entry
    const auditEntry: AuditEntry = {
      timestamp: Date.now(),
      event: 'report_synthesis',
      data: { overallRisk, reportLength: fullReport.length }
    };

    // Generate assessment ID for audit trail
    const { generateAssessmentId } = await import('./audit-trail-export');
    const assessmentId = generateAssessmentId(state.dossier);

    // Emit final result
    if (eventCallback) {
      eventCallback({
        type: 'final-result',
        content: fullReport,
        sources: uniqueSources.map(s => ({ url: s.url, title: s.title })),
        followUpQuestions: [],  // No follow-up questions for HRDD (one-shot workflow)
        assessmentId  // Include assessment ID for audit trail download
      });
    }

    return {
      finalReport: fullReport,
      overallRisk,
      auditTrail: [auditEntry],
      currentPhase: 'complete'
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to synthesize report',
      errorType: 'llm' as const
    };
  }
}
