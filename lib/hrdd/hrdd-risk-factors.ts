/**
 * HRDD Risk Factor Assessment Nodes
 *
 * Implements the three risk factor assessments:
 * 1. Geographic Context Assessment
 * 2. Customer Profile Assessment
 * 3. End-Use Application Assessment
 */

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { FirecrawlClient } from "../core/firecrawl";
import {
  HRDDState,
  GeographicRiskResult,
  CustomerRiskResult,
  EndUseRiskResult,
  Source,
  AuditEntry
} from "./hrdd-state";
import {
  GEOGRAPHIC_RISK_PROMPT,
  CUSTOMER_RISK_PROMPT,
  END_USE_RISK_PROMPT,
  GEOGRAPHIC_QUERY_GENERATION_PROMPT,
  CUSTOMER_QUERY_GENERATION_PROMPT,
  END_USE_QUERY_GENERATION_PROMPT
} from "./hrdd-prompts";
import { HRDD_MODEL_CONFIG, HRDD_WORKFLOW_CONFIG } from "./hrdd-config";
import sourcesConfig from './hrdd-sources.json';

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
  | { type: 'risk-classification'; factor: string; level: 'Low' | 'Medium' | 'High'; rationale: string }
  | { type: 'searching'; query: string; index: number; total: number }
  | { type: 'found'; sources: Source[]; query: string }
  | { type: 'source-processing'; url: string; title: string; stage: 'browsing' | 'extracting' | 'analyzing' }
  | { type: 'source-complete'; url: string; summary: string }
  | { type: 'error'; error: string; errorType?: string };

/**
 * Geographic Context Assessment Node
 *
 * Assesses geographic risk based on Freedom House scores, press freedom, UN reports, etc.
 */
export async function geographicContextAssessment(
  state: HRDDState,
  config?: GraphConfig
): Promise<Partial<HRDDState>> {
  const eventCallback = config?.configurable?.eventCallback;
  const firecrawl = config?.configurable?.firecrawl;

  if (eventCallback) {
    eventCallback({
      type: 'hrdd-phase',
      phase: HRDD_WORKFLOW_CONFIG.PHASES.GEOGRAPHIC_CONTEXT,
      message: `Assessing geographic context for ${state.dossier.country}...`
    });
  }

  try {
    if (!firecrawl) {
      throw new Error('Firecrawl client not configured');
    }

    // Step 1: Generate search queries
    const llm = new ChatOpenAI({
      modelName: HRDD_MODEL_CONFIG.MODEL,
      temperature: HRDD_MODEL_CONFIG.TEMPERATURE,
      maxTokens: HRDD_MODEL_CONFIG.MAX_TOKENS,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const queryGenPrompt = GEOGRAPHIC_QUERY_GENERATION_PROMPT
      .replace('{country}', state.dossier.country)
      .replace('{sourcesConfig}', JSON.stringify(sourcesConfig.geographic_context || []));

    const queryMessages = [
      new SystemMessage(queryGenPrompt),
      new HumanMessage(`Generate search queries for ${state.dossier.country}`)
    ];

    const queryResponse = await llm.invoke(queryMessages);
    const queryContent = queryResponse.content.toString();
    const queryResult = JSON.parse(queryContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim());

    // Combine site-specific and broader queries
    const siteSpecificQueries = (queryResult.site_specific_queries || []).map((q: { query: string }) => q.query);
    const broaderQueries = (queryResult.broader_queries || []).map((q: { query: string }) => q.query);
    const allQueries = [...siteSpecificQueries, ...broaderQueries].slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);

    // Step 2: Execute searches
    const searchResults: Source[] = [];
    const newQueries: string[] = [];

    for (let i = 0; i < allQueries.length; i++) {
      const query = allQueries[i];

      if (eventCallback) {
        eventCallback({
          type: 'searching',
          query,
          index: i + 1,
          total: allQueries.length
        });
      }

      try {
        const results = await firecrawl.search(query, {
          limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
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
        console.error(`Geographic search failed for query: ${query}`, error);
      }
    }

    // Step 3: Classify risk based on search results
    const searchResultsText = searchResults.map((s, idx) =>
      `[${idx + 1}] URL: ${s.url}\nTitle: ${s.title}\nContent: ${s.content?.slice(0, 2000) || 'No content'}`
    ).join('\n\n---\n\n');

    const riskPrompt = GEOGRAPHIC_RISK_PROMPT
      .replace('{country}', state.dossier.country)
      .replace('{searchResults}', searchResultsText || 'No search results found');

    const riskMessages = [
      new SystemMessage(riskPrompt),
      new HumanMessage(`Classify geographic risk for ${state.dossier.country}`)
    ];

    const riskResponse = await llm.invoke(riskMessages);
    const riskContent = riskResponse.content.toString();
    const riskResult = JSON.parse(riskContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim());

    const geographicRisk: GeographicRiskResult = {
      level: riskResult.risk_level || "Medium",
      rationale: riskResult.rationale || '',
      citations: searchResults.map(s => s.url),
      information_gaps: riskResult.information_gaps || [],
      confidence: riskResult.confidence || 0,
      eu_nato_member: riskResult.eu_nato_member ?? null,
      freedom_house_score: riskResult.freedom_house_score ?? null,
      freedom_house_rating: riskResult.freedom_house_rating ?? null,
      press_freedom_index_score: riskResult.press_freedom_index_score ?? null,
      un_investigations: riskResult.un_investigations || [],
      governance_assessment: riskResult.governance_assessment || '',
      ai_governance: riskResult.ai_governance || '',
      sanctions_status: riskResult.sanctions_status || "none"
    };

    // Create audit entry
    const auditEntry: AuditEntry = {
      timestamp: Date.now(),
      event: 'geographic_context_assessment',
      data: { queries: newQueries, result: geographicRisk }
    };

    if (eventCallback) {
      eventCallback({
        type: 'risk-classification',
        factor: 'Geographic Context',
        level: geographicRisk.level,
        rationale: geographicRisk.rationale
      });
    }

    return {
      geographicRisk,
      sources: searchResults,
      queries: newQueries,
      auditTrail: [auditEntry],
      currentPhase: 'customer-profile'
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to assess geographic context',
      errorType: 'llm' as const
    };
  }
}

/**
 * Customer Profile Assessment Node
 *
 * Assesses customer risk based on ethics policies, governance, compliance violations, etc.
 */
export async function customerProfileAssessment(
  state: HRDDState,
  config?: GraphConfig
): Promise<Partial<HRDDState>> {
  const eventCallback = config?.configurable?.eventCallback;
  const firecrawl = config?.configurable?.firecrawl;

  if (eventCallback) {
    eventCallback({
      type: 'hrdd-phase',
      phase: HRDD_WORKFLOW_CONFIG.PHASES.CUSTOMER_PROFILE,
      message: `Assessing customer profile for ${state.dossier.customer}...`
    });
  }

  try {
    if (!firecrawl) {
      throw new Error('Firecrawl client not configured');
    }

    // Step 1: Generate search queries
    const llm = new ChatOpenAI({
      modelName: HRDD_MODEL_CONFIG.MODEL,
      temperature: HRDD_MODEL_CONFIG.TEMPERATURE,
      maxTokens: HRDD_MODEL_CONFIG.MAX_TOKENS,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const queryGenPrompt = CUSTOMER_QUERY_GENERATION_PROMPT
      .replace('{customer}', state.dossier.customer)
      .replace('{sourcesConfig}', JSON.stringify(sourcesConfig.customer_profile || []));

    const queryMessages = [
      new SystemMessage(queryGenPrompt),
      new HumanMessage(`Generate search queries for ${state.dossier.customer}`)
    ];

    const queryResponse = await llm.invoke(queryMessages);
    const queryContent = queryResponse.content.toString();
    const queryResult = JSON.parse(queryContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim());

    // Combine all query types
    const customerWebsiteQueries = (queryResult.customer_website_queries || []).map((q: { query: string }) => q.query);
    const siteSpecificQueries = (queryResult.site_specific_queries || []).map((q: { query: string }) => q.query);
    const adverseMediaQueries = (queryResult.adverse_media_queries || []).map((q: { query: string }) => q.query);
    const broaderQueries = (queryResult.broader_queries || []).map((q: { query: string }) => q.query);
    const allQueries = [
      ...customerWebsiteQueries,
      ...siteSpecificQueries,
      ...adverseMediaQueries,
      ...broaderQueries
    ].slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);

    // Step 2: Execute searches
    const searchResults: Source[] = [];
    const newQueries: string[] = [];

    for (let i = 0; i < allQueries.length; i++) {
      const query = allQueries[i];

      if (eventCallback) {
        eventCallback({
          type: 'searching',
          query,
          index: i + 1,
          total: allQueries.length
        });
      }

      try {
        const results = await firecrawl.search(query, {
          limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
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
        console.error(`Customer search failed for query: ${query}`, error);
      }
    }

    // Step 3: Classify risk based on search results
    const searchResultsText = searchResults.map((s, idx) =>
      `[${idx + 1}] URL: ${s.url}\nTitle: ${s.title}\nContent: ${s.content?.slice(0, 2000) || 'No content'}`
    ).join('\n\n---\n\n');

    const riskPrompt = CUSTOMER_RISK_PROMPT
      .replace('{customer}', state.dossier.customer)
      .replace('{searchResults}', searchResultsText || 'No search results found');

    const riskMessages = [
      new SystemMessage(riskPrompt),
      new HumanMessage(`Classify customer risk for ${state.dossier.customer}`)
    ];

    const riskResponse = await llm.invoke(riskMessages);
    const riskContent = riskResponse.content.toString();
    const riskResult = JSON.parse(riskContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim());

    const customerRisk: CustomerRiskResult = {
      level: riskResult.risk_level || "Medium",
      rationale: riskResult.rationale || '',
      citations: searchResults.map(s => s.url),
      information_gaps: riskResult.information_gaps || [],
      confidence: riskResult.confidence || 0,
      ungp_adoption: riskResult.ungp_adoption === true ? true :
                     riskResult.ungp_adoption === false ? false : "unknown",
      ethics_policies_found: riskResult.ethics_policies_found || false,
      corporate_governance: riskResult.corporate_governance || "Opaque",
      compliance_violations: riskResult.compliance_violations || [],
      adverse_media_findings: riskResult.adverse_media_findings || [],
      ownership_transparency: riskResult.ownership_transparency || "Opaque",
      esg_reporting: riskResult.esg_reporting || false
    };

    // Create audit entry
    const auditEntry: AuditEntry = {
      timestamp: Date.now(),
      event: 'customer_profile_assessment',
      data: { queries: newQueries, result: customerRisk }
    };

    if (eventCallback) {
      eventCallback({
        type: 'risk-classification',
        factor: 'Customer Profile',
        level: customerRisk.level,
        rationale: customerRisk.rationale
      });
    }

    return {
      customerRisk,
      sources: searchResults,
      queries: newQueries,
      auditTrail: [auditEntry],
      currentPhase: 'end-use-application'
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to assess customer profile',
      errorType: 'llm' as const
    };
  }
}

/**
 * End-Use Application Assessment Node
 *
 * Assesses end-use risk based on human control, proximity to harm, repurposing ease.
 */
export async function endUseAssessment(
  state: HRDDState,
  config?: GraphConfig
): Promise<Partial<HRDDState>> {
  const eventCallback = config?.configurable?.eventCallback;
  const firecrawl = config?.configurable?.firecrawl;

  if (eventCallback) {
    eventCallback({
      type: 'hrdd-phase',
      phase: HRDD_WORKFLOW_CONFIG.PHASES.END_USE_APPLICATION,
      message: 'Assessing end-use application risk...'
    });
  }

  try {
    if (!firecrawl) {
      throw new Error('Firecrawl client not configured');
    }

    // Step 1: Generate USE-CASE-SPECIFIC search queries
    const llm = new ChatOpenAI({
      modelName: HRDD_MODEL_CONFIG.MODEL,
      temperature: HRDD_MODEL_CONFIG.TEMPERATURE,
      maxTokens: HRDD_MODEL_CONFIG.MAX_TOKENS,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const queryGenPrompt = END_USE_QUERY_GENERATION_PROMPT
      .replace('{useCase}', state.dossier.useCase)
      .replace('{sourcesConfig}', JSON.stringify(sourcesConfig.end_use_application || []));

    const queryMessages = [
      new SystemMessage(queryGenPrompt),
      new HumanMessage(`Generate search queries for use case: "${state.dossier.useCase}"`)
    ];

    const queryResponse = await llm.invoke(queryMessages);
    const queryContent = queryResponse.content.toString();
    const queryResult = JSON.parse(queryContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim());

    // Combine all query types
    const siteSpecificQueries = (queryResult.site_specific_queries || []).map((q: { query: string }) => q.query);
    const useCaseSpecificQueries = (queryResult.use_case_specific_queries || []).map((q: { query: string }) => q.query);
    const broaderQueries = (queryResult.broader_queries || []).map((q: { query: string }) => q.query);
    const allQueries = [
      ...siteSpecificQueries,
      ...useCaseSpecificQueries,
      ...broaderQueries
    ].slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);

    // Step 2: Execute searches
    const searchResults: Source[] = [];
    const newQueries: string[] = [];

    for (let i = 0; i < allQueries.length; i++) {
      const query = allQueries[i];

      if (eventCallback) {
        eventCallback({
          type: 'searching',
          query,
          index: i + 1,
          total: allQueries.length
        });
      }

      try {
        const results = await firecrawl.search(query, {
          limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
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
        console.error(`End-use search failed for query: ${query}`, error);
      }
    }

    // Step 3: Classify risk based on search results
    const searchResultsText = searchResults.map((s, idx) =>
      `[${idx + 1}] URL: ${s.url}\nTitle: ${s.title}\nContent: ${s.content?.slice(0, 2000) || 'No content'}`
    ).join('\n\n---\n\n');

    const riskPrompt = END_USE_RISK_PROMPT
      .replace('{useCase}', state.dossier.useCase)
      .replace('{searchResults}', searchResultsText || 'No search results found');

    const riskMessages = [
      new SystemMessage(riskPrompt),
      new HumanMessage(`Classify end-use risk for: "${state.dossier.useCase}"`)
    ];

    const riskResponse = await llm.invoke(riskMessages);
    const riskContent = riskResponse.content.toString();
    const riskResult = JSON.parse(riskContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim());

    const endUseRisk: EndUseRiskResult = {
      level: riskResult.risk_level || "Medium",
      rationale: riskResult.rationale || '',
      citations: searchResults.map(s => s.url),
      information_gaps: riskResult.information_gaps || [],
      confidence: riskResult.confidence || 0,
      human_control_level: riskResult.human_control_level || "Medium",
      human_control_rationale: riskResult.human_control_rationale || '',
      proximity_to_harm: riskResult.proximity_to_harm || "Medium",
      proximity_rationale: riskResult.proximity_rationale || '',
      repurposing_ease: riskResult.repurposing_ease || "Medium",
      repurposing_rationale: riskResult.repurposing_rationale || '',
      autonomous_weapons_comparison: riskResult.autonomous_weapons_comparison || '',
      dual_use_classification: riskResult.dual_use_classification || ''
    };

    // Create audit entry
    const auditEntry: AuditEntry = {
      timestamp: Date.now(),
      event: 'end_use_assessment',
      data: { queries: newQueries, result: endUseRisk }
    };

    if (eventCallback) {
      eventCallback({
        type: 'risk-classification',
        factor: 'End-Use Application',
        level: endUseRisk.level,
        rationale: endUseRisk.rationale
      });
    }

    return {
      endUseRisk,
      sources: searchResults,
      queries: newQueries,
      auditTrail: [auditEntry],
      currentPhase: 'synthesis'
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to assess end-use application',
      errorType: 'llm' as const
    };
  }
}
