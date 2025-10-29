/**
 * HRDD Workflow Engine
 *
 * LangGraph-based state machine that orchestrates the two-stage HRDD assessment:
 * 1. Preliminary Screening (weapons, sanctions, jurisdiction)
 * 2. Enhanced Due Diligence (geographic, customer, end-use)
 */

import { StateGraph, END, START } from "@langchain/langgraph";
import { FirecrawlClient } from "../core/firecrawl";
import { HRDDStateAnnotation, HRDDState, Dossier } from "./hrdd-state";
import {
  controversialWeaponsCheck,
  sanctionsCheck,
  highRiskJurisdictionCheck
} from "./hrdd-preliminary-screening";
import {
  geographicContextAssessment,
  customerProfileAssessment,
  endUseAssessment
} from "./hrdd-risk-factors";
import { synthesizeReport } from "./hrdd-synthesis";

// Union of all event types from different modules
export type HRDDEvent =
  | { type: 'hrdd-phase'; phase: string; message: string }
  | { type: 'preliminary-result'; passed: boolean; details: object }
  | { type: 'risk-classification'; factor: string; level: 'Low' | 'Medium' | 'High'; rationale: string }
  | { type: 'searching'; query: string; index: number; total: number }
  | { type: 'found'; sources: { url: string; title: string; content?: string }[]; query: string }
  | { type: 'source-processing'; url: string; title: string; stage: 'browsing' | 'extracting' | 'analyzing' }
  | { type: 'source-complete'; url: string; summary: string }
  | { type: 'content-chunk'; chunk: string }
  | { type: 'final-result'; content: string; sources: { url: string; title: string }[]; followUpQuestions?: string[] }
  | { type: 'error'; error: string; errorType?: string };

// Graph configuration type
interface GraphConfig {
  configurable?: {
    eventCallback?: (event: HRDDEvent) => void;
    firecrawl?: FirecrawlClient;
  };
}

/**
 * HRDD Workflow Engine
 *
 * Orchestrates the complete HRDD assessment workflow using LangGraph.
 */
export class HRDDWorkflowEngine {
  private firecrawl: FirecrawlClient;
  private graph: ReturnType<typeof this.buildGraph>;

  constructor(firecrawl: FirecrawlClient) {
    this.firecrawl = firecrawl;
    this.graph = this.buildGraph();
  }

  /**
   * Build LangGraph workflow
   */
  private buildGraph() {
    const firecrawl = this.firecrawl;

    const workflow = new StateGraph(HRDDStateAnnotation)
      // ===================================================================
      // PRELIMINARY SCREENING NODES
      // ===================================================================

      .addNode("controversialWeapons", async (state: HRDDState, config?: GraphConfig) => {
        return controversialWeaponsCheck(state, {
          configurable: {
            eventCallback: config?.configurable?.eventCallback,
            firecrawl
          }
        });
      })

      .addNode("sanctions", async (state: HRDDState, config?: GraphConfig) => {
        return sanctionsCheck(state, {
          configurable: {
            eventCallback: config?.configurable?.eventCallback,
            firecrawl
          }
        });
      })

      .addNode("jurisdiction", async (state: HRDDState, config?: GraphConfig) => {
        return highRiskJurisdictionCheck(state, {
          configurable: {
            eventCallback: config?.configurable?.eventCallback,
            firecrawl
          }
        });
      })

      // ===================================================================
      // ENHANCED DUE DILIGENCE NODES
      // ===================================================================

      .addNode("geographicContext", async (state: HRDDState, config?: GraphConfig) => {
        return geographicContextAssessment(state, {
          configurable: {
            eventCallback: config?.configurable?.eventCallback,
            firecrawl
          }
        });
      })

      .addNode("customerProfile", async (state: HRDDState, config?: GraphConfig) => {
        return customerProfileAssessment(state, {
          configurable: {
            eventCallback: config?.configurable?.eventCallback,
            firecrawl
          }
        });
      })

      .addNode("endUse", async (state: HRDDState, config?: GraphConfig) => {
        return endUseAssessment(state, {
          configurable: {
            eventCallback: config?.configurable?.eventCallback,
            firecrawl
          }
        });
      })

      // ===================================================================
      // SYNTHESIS NODE
      // ===================================================================

      .addNode("synthesize", async (state: HRDDState, config?: GraphConfig) => {
        return synthesizeReport(state, config);
      })

      // ===================================================================
      // ERROR HANDLING NODE
      // ===================================================================

      .addNode("handleError", async (state: HRDDState, config?: GraphConfig): Promise<Partial<HRDDState>> => {
        const eventCallback = config?.configurable?.eventCallback;

        if (eventCallback) {
          eventCallback({
            type: 'error',
            error: state.error || 'An unknown error occurred',
            errorType: state.errorType || 'unknown'
          });
        }

        // For HRDD, we don't retry - we want to complete the assessment even with errors
        // Just continue to next phase or end if critical error
        return {
          currentPhase: 'error'
        };
      });

    // ===================================================================
    // WORKFLOW EDGES
    // ===================================================================

    workflow
      // Start with preliminary screening
      .addEdge(START, "controversialWeapons")

      // Preliminary screening sequence
      .addConditionalEdges(
        "controversialWeapons",
        (state: HRDDState) => state.error ? "handleError" : "sanctions",
        {
          handleError: "handleError",
          sanctions: "sanctions"
        }
      )

      .addConditionalEdges(
        "sanctions",
        (state: HRDDState) => state.error ? "handleError" : "jurisdiction",
        {
          handleError: "handleError",
          jurisdiction: "jurisdiction"
        }
      )

      // After jurisdiction check, ALWAYS continue to Enhanced DD
      // (even if preliminary screening failed - spec requirement)
      .addConditionalEdges(
        "jurisdiction",
        (state: HRDDState) => state.error ? "handleError" : "geographicContext",
        {
          handleError: "handleError",
          geographicContext: "geographicContext"
        }
      )

      // Enhanced Due Diligence sequence
      .addConditionalEdges(
        "geographicContext",
        (state: HRDDState) => state.error ? "handleError" : "customerProfile",
        {
          handleError: "handleError",
          customerProfile: "customerProfile"
        }
      )

      .addConditionalEdges(
        "customerProfile",
        (state: HRDDState) => state.error ? "handleError" : "endUse",
        {
          handleError: "handleError",
          endUse: "endUse"
        }
      )

      .addConditionalEdges(
        "endUse",
        (state: HRDDState) => state.error ? "handleError" : "synthesize",
        {
          handleError: "handleError",
          synthesize: "synthesize"
        }
      )

      // Synthesis completes workflow
      .addConditionalEdges(
        "synthesize",
        (state: HRDDState) => state.error ? "handleError" : END,
        {
          handleError: "handleError",
          [END]: END
        }
      )

      // Error handler ends workflow
      .addEdge("handleError", END);

    // Compile workflow
    return workflow.compile();
  }

  /**
   * Run HRDD Assessment
   *
   * Executes the complete two-stage HRDD assessment workflow.
   *
   * @param dossier - Customer dossier with customer, useCase, country
   * @param onEvent - Event callback for progress updates
   */
  async runAssessment(
    dossier: Dossier,
    onEvent: (event: HRDDEvent) => void
  ): Promise<void> {
    try {
      const initialState: HRDDState = {
        dossier,
        preliminaryScreening: {
          weapons: null,
          sanctions: null,
          jurisdiction: null,
          outcome: null
        },
        geographicRisk: null,
        customerRisk: null,
        endUseRisk: null,
        sources: [],
        queries: [],
        finalReport: null,
        overallRisk: null,
        auditTrail: [],
        rejected: false,
        currentPhase: 'preliminary-screening',
        error: null,
        errorType: null
      };

      // Configure with event callback and firecrawl client
      const config: GraphConfig = {
        configurable: {
          eventCallback: onEvent,
          firecrawl: this.firecrawl
        }
      };

      // Invoke the graph with increased recursion limit
      const finalState = await this.graph.invoke(initialState, {
        ...config,
        recursionLimit: 50  // HRDD workflow has more nodes than conversational search
      });

      // Export audit trail after assessment completes
      try {
        const { buildAuditTrailExport, storeAuditTrail, exportAuditTrailToFile } = await import('../export/audit-trail-export');
        const auditExport = buildAuditTrailExport(finalState);

        // Store in memory for API access
        storeAuditTrail(auditExport);

        // Export to file
        try {
          const exportResult = await exportAuditTrailToFile(auditExport);
          if (exportResult.success) {
            console.log(`[HRDD] Audit trail exported: ${exportResult.filePath}`);
          } else {
            console.error(`[HRDD] Audit trail export failed: ${exportResult.error}`);
          }
        } catch (fileError) {
          console.error('[HRDD] File export error:', fileError);
          // Continue - in-memory storage still works
        }
      } catch (exportError) {
        console.error('[HRDD] Failed to export audit trail:', exportError);
        // Don't fail the assessment if export fails
      }
    } catch (error) {
      onEvent({
        type: 'error',
        error: error instanceof Error ? error.message : 'HRDD assessment failed',
        errorType: 'unknown'
      });
    }
  }

  /**
   * Get workflow phases for UI display
   */
  getWorkflowPhases(): string[] {
    return [
      'Preliminary Screening',
      'Geographic Context Assessment',
      'Customer Profile Assessment',
      'End-Use Application Assessment',
      'Report Synthesis'
    ];
  }
}
