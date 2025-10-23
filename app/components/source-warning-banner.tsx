'use client';

/**
 * SourceWarningBanner Component
 *
 * Displays a yellow warning banner when critical authoritative sources (priority: "critical")
 * could not be accessed during the HRDD assessment. This alerts reviewers that manual
 * verification is required before finalizing the risk classification.
 *
 * This banner appears above the report if information gaps are detected.
 */

interface SourceWarningBannerProps {
  /** Names of critical sources that were unavailable */
  missingSources: string[];
}

export function SourceWarningBanner({ missingSources }: SourceWarningBannerProps) {
  if (missingSources.length === 0) {
    return null;
  }

  const sourcesText = missingSources.join(', ');

  return (
    <div
      className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 dark:border-yellow-600 rounded-lg p-4 mb-6"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Warning icon */}
        <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 dark:bg-yellow-600 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-yellow-900 dark:text-yellow-100 font-semibold text-base mb-1">
            WARNING: Critical Sources Unavailable
          </h3>
          <p className="text-yellow-800 dark:text-yellow-200 text-sm leading-relaxed">
            Unable to access: <span className="font-medium">{sourcesText}</span>
          </p>
          <p className="text-yellow-800 dark:text-yellow-200 text-sm mt-1">
            Manual verification required before finalizing risk classification.
          </p>
        </div>
      </div>
    </div>
  );
}
