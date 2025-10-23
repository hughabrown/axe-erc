'use client';

import { useState, useEffect, useRef } from 'react';
import { hrddAssessment } from './search';
import { readStreamableValue } from 'ai/rsc';
import { SearchDisplay } from './search-display';
import { MarkdownRenderer } from './markdown-renderer';
import { CitationTooltip } from './citation-tooltip';
import { RejectedBanner } from './components/rejected-banner';
import { SourceWarningBanner } from './components/source-warning-banner';
import { AuditTrailDownload } from './components/audit-trail-download';
import Image from 'next/image';
import { getFaviconUrl, getDefaultFavicon, markFaviconFailed } from '@/lib/favicon-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Type imports - we'll need to update these to match HRDD types
type HRDDEvent =
  | { type: 'hrdd-phase'; phase: string; message: string }
  | { type: 'preliminary-result'; passed: boolean; details: object }
  | { type: 'risk-classification'; factor: string; level: 'Low' | 'Medium' | 'High'; rationale: string }
  | { type: 'searching'; query: string; index: number; total: number }
  | { type: 'found'; sources: { url: string; title: string; content?: string }[]; query: string }
  | { type: 'source-processing'; url: string; title: string; stage: 'browsing' | 'extracting' | 'analyzing' }
  | { type: 'source-complete'; url: string; summary: string }
  | { type: 'content-chunk'; chunk: string }
  | { type: 'final-result'; content: string; sources: { url: string; title: string }[]; followUpQuestions?: string[]; rejected?: boolean; missingSources?: string[]; assessmentId?: string }
  | { type: 'error'; error: string; errorType?: string };

interface Source {
  url: string;
  title: string;
  content?: string;
}

// Helper component for sources list
function SourcesList({ sources }: { sources: Source[] }) {
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<number | null>(null);

  return (
    <>
      {/* Sources button with favicon preview */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex -space-x-2">
          {(() => {
            // Get unique domains
            const uniqueDomains = new Map<string, Source>();
            sources.forEach(source => {
              try {
                const domain = new URL(source.url).hostname;
                if (!uniqueDomains.has(domain)) {
                  uniqueDomains.set(domain, source);
                }
              } catch {}
            });
            const uniqueSources = Array.from(uniqueDomains.values());

            return (
              <>
                {uniqueSources.slice(0, 5).map((source, i) => (
                  <Image
                    key={i}
                    src={getFaviconUrl(source.url)}
                    alt=""
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-white"
                    style={{ zIndex: 5 - i }}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = getDefaultFavicon(24);
                      markFaviconFailed(source.url);
                    }}
                  />
                ))}
                {uniqueSources.length > 5 && (
                  <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">+{uniqueSources.length - 5}</span>
                  </div>
                )}
              </>
            );
          })()}
        </div>
        <button
          onClick={() => setShowSourcesPanel(true)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-2"
        >
          <span>View {sources.length} sources & page contents</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Click-away overlay */}
      {showSourcesPanel && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowSourcesPanel(false)}
        />
      )}

      {/* Sources Panel */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
        showSourcesPanel ? 'translate-x-0' : 'translate-x-full'
      } z-40 overflow-y-auto scrollbar-hide`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Sources ({sources.length})</h3>
            <button
              onClick={() => setShowSourcesPanel(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            {sources.map((source, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors">
                <div
                  className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${expandedSourceIndex === i ? '' : 'rounded-lg'}`}
                  onClick={() => setExpandedSourceIndex(expandedSourceIndex === i ? null : i)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-medium text-[#F4BE18] mt-0.5">[{i + 1}]</span>
                    <Image
                      src={getFaviconUrl(source.url)}
                      alt=""
                      width={20}
                      height={20}
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.src = getDefaultFavicon(20);
                        markFaviconFailed(source.url);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm text-gray-900 dark:text-gray-100 hover:text-[#F4BE18] dark:hover:text-[#F4BE18] line-clamp-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {source.title}
                      </a>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {new URL(source.url).hostname}
                      </p>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${expandedSourceIndex === i ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {expandedSourceIndex === i && source.content && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {source.content.length.toLocaleString()} characters
                      </span>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto scrollbar-hide">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={source.content} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function Chat() {
  // HRDD dossier form fields
  const [customer, setCustomer] = useState('');
  const [useCase, setUseCase] = useState('');
  const [country, setCountry] = useState('');

  const [isAssessing, setIsAssessing] = useState(false);
  const [showDossierForm, setShowDossierForm] = useState(true);
  const [assessmentDisplay, setAssessmentDisplay] = useState<React.ReactNode>(null);
  const [finalReport, setFinalReport] = useState<{ content: string; sources: Source[]; rejected?: boolean; missingSources?: string[]; assessmentId?: string } | null>(null);
  const [currentDossier, setCurrentDossier] = useState<{ customer: string; useCase: string; country: string } | null>(null);

  const [firecrawlApiKey, setFirecrawlApiKey] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [, setIsCheckingEnv] = useState<boolean>(true);
  const [pendingDossier, setPendingDossier] = useState<{ customer: string; useCase: string; country: string } | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Check for environment variables on mount
  useEffect(() => {
    const checkEnvironment = async () => {
      setIsCheckingEnv(true);
      try {
        const response = await fetch('/api/check-env');
        const data = await response.json();

        if (data.environmentStatus) {
          setHasApiKey(data.environmentStatus.FIRECRAWL_API_KEY);
        }
      } catch (error) {
        console.error('Failed to check environment:', error);
        setHasApiKey(false);
      } finally {
        setIsCheckingEnv(false);
      }
    };

    checkEnvironment();
  }, []);

  // Auto-scroll to bottom when assessment updates
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [assessmentDisplay, finalReport]);

  const saveApiKey = () => {
    if (firecrawlApiKey.trim()) {
      setHasApiKey(true);
      setShowApiKeyModal(false);
      toast.success('API key saved! Starting assessment...');

      // Continue with the pending assessment
      if (pendingDossier) {
        performAssessment(pendingDossier);
        setPendingDossier(null);
      }
    }
  };

  const performAssessment = async (dossier: { customer: string; useCase: string; country: string }) => {
    setIsAssessing(true);
    setShowDossierForm(false);
    setCurrentDossier(dossier);

    const events: HRDDEvent[] = [];
    setAssessmentDisplay(<SearchDisplay events={events} />);

    try {
      // Get assessment stream
      const { stream } = await hrddAssessment(dossier, firecrawlApiKey || undefined);
      let finalContent = '';
      let finalSources: Source[] = [];
      let isRejected = false;
      let missingSources: string[] = [];

      // Read stream and update events
      for await (const event of readStreamableValue(stream)) {
        if (event) {
          events.push(event);

          // Handle content streaming
          if (event.type === 'content-chunk') {
            const content = events
              .filter(e => e.type === 'content-chunk')
              .map(e => e.type === 'content-chunk' ? e.chunk : '')
              .join('');

            setFinalReport({ content, sources: finalSources, rejected: isRejected, missingSources });
          }

          // Capture final result
          if (event.type === 'final-result') {
            finalContent = event.content;
            finalSources = event.sources || [];
            isRejected = event.rejected || false;
            missingSources = event.missingSources || [];
            setFinalReport({
              content: finalContent,
              sources: finalSources,
              rejected: isRejected,
              missingSources,
              assessmentId: event.assessmentId
            });
          }

          // Update assessment display with new events
          setAssessmentDisplay(<SearchDisplay events={[...events]} />);
        }
      }
    } catch (error) {
      console.error('Assessment error:', error);

      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during assessment';
      setAssessmentDisplay(
        <div className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-700 dark:text-red-300 font-medium">Assessment Error</p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errorMessage}</p>
          {(errorMessage.includes('API key') || errorMessage.includes('OPENAI_API_KEY')) && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">
              Please ensure all required API keys are set in your environment variables:
              <br />• OPENAI_API_KEY (for GPT-4o)
              <br />• FIRECRAWL_API_KEY (can be provided via UI)
            </p>
          )}
          <Button
            onClick={() => {
              setShowDossierForm(true);
              setAssessmentDisplay(null);
              setFinalReport(null);
            }}
            className="mt-4"
            variant="code"
          >
            Try Again
          </Button>
        </div>
      );
    } finally {
      setIsAssessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || !useCase.trim() || !country.trim() || isAssessing) return;

    const dossier = { customer, useCase, country };

    // Check if we have API key
    if (!hasApiKey) {
      setPendingDossier(dossier);
      setShowApiKeyModal(true);
      return;
    }

    // Perform the assessment
    await performAssessment(dossier);
  };

  const handleNewAssessment = () => {
    setShowDossierForm(true);
    setAssessmentDisplay(null);
    setFinalReport(null);
    setCustomer('');
    setUseCase('');
    setCountry('');
  };

  const handleCancelAssessment = () => {
    setIsAssessing(false);
    setAssessmentDisplay(null);
    setShowDossierForm(true);
    toast.info('Assessment cancelled');
  };

  const handleCopyReport = async () => {
    if (!finalReport?.content) return;

    try {
      await navigator.clipboard.writeText(finalReport.content);
      toast.success('Report copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy report:', error);
      toast.error('Failed to copy report to clipboard');
    }
  };

  const testMode = process.env.NEXT_PUBLIC_HRDD_TEST_MODE === 'true';

  return (
    <div className="flex flex-col flex-1">
      {/* Test Mode Banner */}
      {testMode && (
        <div className="mx-4 mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-900 text-sm">
          ⚠️ <strong>TEST MODE:</strong> Using mock data. No API calls will be made.
        </div>
      )}

      {showDossierForm ? (
        // Dossier input form - centered when no assessment
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Customer Name
                </label>
                <Input
                  id="customer"
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="e.g., TechCorp EU"
                  className="w-full"
                  disabled={isAssessing}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="useCase" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Use Case Description
                </label>
                <Textarea
                  id="useCase"
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  placeholder="Describe the intended use of the AI system..."
                  className="w-full min-h-32"
                  disabled={isAssessing}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Deployment Country
                </label>
                <Input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g., Germany"
                  className="w-full"
                  disabled={isAssessing}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isAssessing || !customer.trim() || !useCase.trim() || !country.trim()}
                className="w-full"
              >
                {isAssessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Assessment...
                  </span>
                ) : (
                  'Start HRDD Assessment'
                )}
              </Button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Assessment may take up to 1 hour to complete
              </p>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Assessment results display */}
          <div className="flex-1 overflow-auto scrollbar-hide px-4 sm:px-6 lg:px-8 py-6" ref={messagesContainerRef}>
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Show dossier info at top */}
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Dossier Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium text-gray-600 dark:text-gray-400">Customer:</span> {customer}</p>
                  <p><span className="font-medium text-gray-600 dark:text-gray-400">Country:</span> {country}</p>
                  <p><span className="font-medium text-gray-600 dark:text-gray-400">Use Case:</span> {useCase}</p>
                </div>
              </div>

              {/* Cancel button during assessment */}
              {isAssessing && !finalReport && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelAssessment}
                    className="w-full max-w-md"
                  >
                    Cancel Assessment
                  </Button>
                </div>
              )}

              {/* Assessment progress */}
              {assessmentDisplay}

              {/* Final report */}
              {finalReport && (
                <div className="space-y-4 mt-6">
                  {/* Report header with actions */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assessment Report</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleCopyReport}
                        variant="code"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Report
                      </Button>
                      <Button
                        onClick={handleNewAssessment}
                        variant="code"
                        size="sm"
                      >
                        New Assessment
                      </Button>
                    </div>
                  </div>

                  {/* Warning banners */}
                  {finalReport.rejected && <RejectedBanner />}
                  {finalReport.missingSources && finalReport.missingSources.length > 0 && (
                    <SourceWarningBanner missingSources={finalReport.missingSources} />
                  )}

                  {/* Audit Trail Download */}
                  {finalReport.assessmentId && currentDossier && (
                    <div className="mb-4">
                      <AuditTrailDownload
                        assessmentId={finalReport.assessmentId}
                        customer={currentDossier.customer}
                      />
                    </div>
                  )}

                  {/* Report content */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownRenderer content={finalReport.content} />
                  </div>

                  <CitationTooltip sources={finalReport.sources} />

                  {/* Sources */}
                  <SourcesList sources={finalReport.sources} />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* API Key Modal */}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle>Firecrawl API Key Required</DialogTitle>
            <DialogDescription>
              To perform HRDD assessment, you need a Firecrawl API key. You can get one for free.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Button
                onClick={() => window.open('https://www.firecrawl.dev/app/api-keys', '_blank')}
                className="w-full"
                variant="code"
              >
                Get your free API key from Firecrawl →
              </Button>
            </div>
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium">
                Enter your API key
              </label>
              <Input
                id="apiKey"
                type="password"
                value={firecrawlApiKey}
                onChange={(e) => setFirecrawlApiKey(e.target.value)}
                placeholder="fc-..."
                className="w-full"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="code"
              onClick={() => setShowApiKeyModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={saveApiKey}
              disabled={!firecrawlApiKey.trim()}
            >
              Save and Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
