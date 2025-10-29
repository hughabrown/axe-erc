/**
 * HRDD Preliminary Screening Nodes
 *
 * Implements the three preliminary screening checks:
 * 1. Controversial Weapons Check
 * 2. Sanctions Check
 * 3. High-Risk Jurisdiction Check
 */

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { FirecrawlClient } from "../core/firecrawl";
import {
  HRDDState,
  WeaponsCheckResult,
  SanctionsCheckResult,
  JurisdictionCheckResult,
  Source,
  AuditEntry
} from "./hrdd-state";
import {
  CONTROVERSIAL_WEAPONS_PROMPT,
  SANCTIONS_CHECK_PROMPT,
  HIGH_RISK_JURISDICTION_PROMPT
} from "./hrdd-prompts";
import { HRDD_MODEL_CONFIG, HRDD_WORKFLOW_CONFIG } from "./hrdd-config";

// Define config type for event callbacks
interface GraphConfig {
  configurable?: {
    eventCallback?: (event: HRDDEvent) => void;
    firecrawl?: FirecrawlClient;
  };
}

// Event types for HRDD workflow
export type HRDDEvent =
  | { type: 'hrdd-phase'; phase: string; message: string }
  | { type: 'preliminary-result'; passed: boolean; details: object }
  | { type: 'searching'; query: string; index: number; total: number }
  | { type: 'found'; sources: Source[]; query: string }
  | { type: 'error'; error: string; errorType?: string };

/**
 * Controversial Weapons Check Node
 *
 * Analyzes use case description to determine if it involves prohibited weapons.
 */
export async function controversialWeaponsCheck(
  state: HRDDState,
  config?: GraphConfig
): Promise<Partial<HRDDState>> {
  const eventCallback = config?.configurable?.eventCallback;

  if (eventCallback) {
    eventCallback({
      type: 'hrdd-phase',
      phase: HRDD_WORKFLOW_CONFIG.PHASES.PRELIMINARY_SCREENING,
      message: 'Preliminary Screening'
    });

    eventCallback({
      type: 'searching',
      query: 'Controversial weapons check',
      index: 1,
      total: 3
    });
  }

  try {
    const llm = new ChatOpenAI({
      modelName: HRDD_MODEL_CONFIG.MODEL,
      temperature: HRDD_MODEL_CONFIG.TEMPERATURE,
      maxTokens: HRDD_MODEL_CONFIG.MAX_TOKENS,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Prepare prompt with use case
    const prompt = CONTROVERSIAL_WEAPONS_PROMPT.replace('{useCase}', state.dossier.useCase);

    const messages = [
      new SystemMessage(prompt),
      new HumanMessage(`Analyze this use case: "${state.dossier.useCase}"`)
    ];

    const response = await llm.invoke(messages);
    const content = response.content.toString();

    // Parse JSON response
    const result = JSON.parse(content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim());

    const weaponsResult: WeaponsCheckResult = {
      prohibited: result.overall_prohibited || false,
      rationale: result.summary || '',
      confidence: Math.min(
        result.nuclear_chemical_biological?.confidence || 0,
        result.cluster_munitions_mines?.confidence || 0,
        result.autonomous_weapons?.confidence || 0
      ),
      nuclear_chemical_biological: result.nuclear_chemical_biological,
      cluster_munitions_mines: result.cluster_munitions_mines,
      autonomous_weapons: result.autonomous_weapons
    };

    // Create audit entry
    const auditEntry: AuditEntry = {
      timestamp: Date.now(),
      event: 'controversial_weapons_check',
      data: { result: weaponsResult }
    };

    // Determine if preliminary screening should fail
    const rejected = weaponsResult.prohibited;

    return {
      preliminaryScreening: {
        ...state.preliminaryScreening,
        weapons: weaponsResult
      },
      rejected: rejected || state.rejected,
      auditTrail: [auditEntry],
      currentPhase: 'preliminary-screening'
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to check controversial weapons',
      errorType: 'llm' as const
    };
  }
}

/**
 * Sanctions Check Node
 *
 * Searches sanctions databases and interprets results for customer/country.
 */
export async function sanctionsCheck(
  state: HRDDState,
  config?: GraphConfig
): Promise<Partial<HRDDState>> {
  const eventCallback = config?.configurable?.eventCallback;
  const firecrawl = config?.configurable?.firecrawl;

  if (eventCallback) {
    eventCallback({
      type: 'searching',
      query: 'Sanctions check',
      index: 2,
      total: 3
    });
  }

  try {
    if (!firecrawl) {
      throw new Error('Firecrawl client not configured');
    }

    // Generate sanctions search queries
    const queries = [
      `site:treasury.gov/ofac ${state.dossier.customer}`,
      `site:un.org/securitycouncil/sanctions ${state.dossier.customer}`,
      `site:sanctionsmap.eu ${state.dossier.customer}`,
      `site:treasury.gov/ofac ${state.dossier.country}`,
      `site:un.org/securitycouncil/sanctions ${state.dossier.country}`
    ];

    const searchResults: Source[] = [];
    const newQueries: string[] = [];

    // Execute searches
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];

      if (eventCallback) {
        eventCallback({
          type: 'searching',
          query,
          index: i + 1,
          total: queries.length
        });
      }

      try {
        console.log(`[HRDD] Starting search: ${query}`);
        const results = await firecrawl.search(query, {
          limit: 5,
          scrapeOptions: { formats: ['markdown'] }
        });
        console.log(`[HRDD] Search completed: ${query}, found ${results.data?.length || 0} results`);

        const sources: Source[] = results.data.map((r: { url: string; title: string; markdown?: string; content?: string }) => ({
          url: r.url,
          title: r.title,
          content: r.markdown || r.content || ''
        }));

        searchResults.push(...sources);
        newQueries.push(query);

        // Add audit entry for query execution
        const queryAuditEntry: AuditEntry = {
          timestamp: Date.now(),
          event: 'query_executed',
          data: {
            query,
            phase: 'preliminary-screening-sanctions',
            resultsCount: sources.length
          }
        };
        if (!state.auditTrail) {
          (state as any).auditTrail = [];
        }
        (state as any).auditTrail.push(queryAuditEntry);

        if (eventCallback && sources.length > 0) {
          eventCallback({
            type: 'found',
            sources,
            query
          });
        }
      } catch (error) {
        // Continue even if one search fails
        console.error(`[HRDD] Sanctions search failed for query: ${query}`, error);
      }
    }

    // Analyze search results with LLM
    const llm = new ChatOpenAI({
      modelName: HRDD_MODEL_CONFIG.MODEL,
      temperature: HRDD_MODEL_CONFIG.TEMPERATURE,
      maxTokens: HRDD_MODEL_CONFIG.MAX_TOKENS,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const searchResultsText = searchResults.map(s =>
      `URL: ${s.url}\nTitle: ${s.title}\nContent: ${s.content?.slice(0, 1000) || 'No content'}`
    ).join('\n\n---\n\n');

    const prompt = SANCTIONS_CHECK_PROMPT
      .replace('{customer}', state.dossier.customer)
      .replace('{country}', state.dossier.country)
      .replace('{searchResults}', searchResultsText || 'No search results found');

    const messages = [
      new SystemMessage(prompt),
      new HumanMessage(`Analyze sanctions status based on search results.`)
    ];

    const response = await llm.invoke(messages);
    const content = response.content.toString();

    // Parse JSON response
    const result = JSON.parse(content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim());

    const sanctionsResult: SanctionsCheckResult = {
      customer_sanctioned: result.customer_sanctioned === true ? true :
                          result.customer_sanctioned === false ? false : "inconclusive",
      customer_sanctions_programs: result.customer_sanctions_programs || [],
      country_sanctioned: result.country_sanctioned === true ? true :
                         result.country_sanctioned === false ? false : "inconclusive",
      country_sanctions_type: result.country_sanctions_type || "none",
      country_sanctions_programs: result.country_sanctions_programs || [],
      rationale: result.rationale || '',
      information_gaps: result.information_gaps || [],
      confidence: result.confidence || 0
    };

    // Create audit entry
    const auditEntry: AuditEntry = {
      timestamp: Date.now(),
      event: 'sanctions_check',
      data: { queries: newQueries, result: sanctionsResult }
    };

    // Determine if preliminary screening should fail
    const rejected = sanctionsResult.customer_sanctioned === true ||
                    sanctionsResult.country_sanctions_type === "comprehensive";

    return {
      preliminaryScreening: {
        ...state.preliminaryScreening,
        sanctions: sanctionsResult
      },
      sources: searchResults,
      queries: newQueries,
      rejected: rejected || state.rejected,
      auditTrail: [auditEntry],
      currentPhase: 'preliminary-screening'
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to check sanctions',
      errorType: 'search' as const
    };
  }
}

/**
 * High-Risk Jurisdiction Check Node
 *
 * Searches UN/ICC/ICJ/HR organizations for systematic violations.
 */
export async function highRiskJurisdictionCheck(
  state: HRDDState,
  config?: GraphConfig
): Promise<Partial<HRDDState>> {
  const eventCallback = config?.configurable?.eventCallback;
  const firecrawl = config?.configurable?.firecrawl;

  if (eventCallback) {
    eventCallback({
      type: 'searching',
      query: 'Credible accusations check',
      index: 3,
      total: 3
    });
  }

  try {
    if (!firecrawl) {
      throw new Error('Firecrawl client not configured');
    }

    // Generate jurisdiction search queries
    const queries = [
      `site:ohchr.org ${state.dossier.country} human rights investigation`,
      `site:icc-cpi.int ${state.dossier.country}`,
      `site:icj-cij.org ${state.dossier.country}`,
      `site:amnesty.org ${state.dossier.country} systematic violations`,
      `site:hrw.org ${state.dossier.country} human rights violations`
    ];

    const searchResults: Source[] = [];
    const newQueries: string[] = [];

    // Execute searches
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];

      if (eventCallback) {
        eventCallback({
          type: 'searching',
          query,
          index: i + 1,
          total: queries.length
        });
      }

      try {
        const results = await firecrawl.search(query, {
          limit: 5,
          scrapeOptions: { formats: ['markdown'] }
        });

        const sources: Source[] = results.data.map((r: { url: string; title: string; markdown?: string; content?: string }) => ({
          url: r.url,
          title: r.title,
          content: r.markdown || r.content || ''
        }));

        searchResults.push(...sources);
        newQueries.push(query);

        if (eventCallback && sources.length > 0) {
          eventCallback({
            type: 'found',
            sources,
            query
          });
        }
      } catch (error) {
        // Continue even if one search fails
        console.error(`Jurisdiction search failed for query: ${query}`, error);
      }
    }

    // Analyze search results with LLM
    const llm = new ChatOpenAI({
      modelName: HRDD_MODEL_CONFIG.MODEL,
      temperature: HRDD_MODEL_CONFIG.TEMPERATURE,
      maxTokens: HRDD_MODEL_CONFIG.MAX_TOKENS,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const searchResultsText = searchResults.map(s =>
      `URL: ${s.url}\nTitle: ${s.title}\nContent: ${s.content?.slice(0, 1000) || 'No content'}`
    ).join('\n\n---\n\n');

    const prompt = HIGH_RISK_JURISDICTION_PROMPT
      .replace('{country}', state.dossier.country)
      .replace('{searchResults}', searchResultsText || 'No search results found');

    const messages = [
      new SystemMessage(prompt),
      new HumanMessage(`Analyze jurisdiction risk based on search results.`)
    ];

    const response = await llm.invoke(messages);
    const content = response.content.toString();

    // Parse JSON response
    const result = JSON.parse(content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim());

    const jurisdictionResult: JurisdictionCheckResult = {
      automatic_high_risk: result.automatic_high_risk === true ? true :
                          result.automatic_high_risk === false ? false : "inconclusive",
      un_bodies_accusations: result.un_bodies_accusations || [],
      international_court_cases: result.international_court_cases || [],
      hr_organization_reports: result.hr_organization_reports || [],
      rationale: result.rationale || '',
      information_gaps: result.information_gaps || [],
      confidence: result.confidence || 0
    };

    // Create audit entry
    const auditEntry: AuditEntry = {
      timestamp: Date.now(),
      event: 'jurisdiction_check',
      data: { queries: newQueries, result: jurisdictionResult }
    };

    // Determine if preliminary screening should fail
    const rejected = jurisdictionResult.automatic_high_risk === true;

    // Determine overall preliminary screening outcome
    const outcome = (state.rejected || rejected) ? "FAIL" : "PASS";

    if (eventCallback) {
      eventCallback({
        type: 'preliminary-result',
        passed: outcome === "PASS",
        details: {
          weapons: state.preliminaryScreening.weapons,
          sanctions: state.preliminaryScreening.sanctions,
          jurisdiction: jurisdictionResult
        }
      });
    }

    return {
      preliminaryScreening: {
        ...state.preliminaryScreening,
        jurisdiction: jurisdictionResult,
        outcome
      },
      sources: searchResults,
      queries: newQueries,
      rejected: rejected || state.rejected,
      auditTrail: [auditEntry],
      currentPhase: 'geographic-context'  // Move to next phase
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to check jurisdiction risk',
      errorType: 'search' as const
    };
  }
}
