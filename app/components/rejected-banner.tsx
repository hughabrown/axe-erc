'use client';

/**
 * RejectedBanner Component
 *
 * Displays a prominent red banner when preliminary screening has detected prohibited
 * activities, sanctions, or systematic violations, marking the customer as REJECTED.
 *
 * This banner appears above the Executive Summary section of HRDD reports to ensure
 * immediate visibility of the rejection status.
 */

interface RejectedBannerProps {
  /** Specific reason(s) for rejection (e.g., "prohibited weapons", "sanctions", "systematic violations") */
  reasons?: string[];
}

export function RejectedBanner({ reasons = [] }: RejectedBannerProps) {
  const defaultReason = 'prohibited activities/sanctions/systematic violations';
  const reasonText = reasons.length > 0 ? reasons.join(', ') : defaultReason;

  return (
    <div
      className="bg-red-50 dark:bg-red-900/20 border-2 border-red-600 dark:border-red-500 rounded-lg p-4 mb-6"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        {/* Warning icon */}
        <div className="flex-shrink-0 w-6 h-6 bg-red-600 dark:bg-red-500 rounded-full flex items-center justify-center">
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-red-900 dark:text-red-100 font-bold text-base mb-1">
            CUSTOMER REJECTED
          </h3>
          <p className="text-red-800 dark:text-red-200 text-sm leading-relaxed">
            Preliminary screening detected {reasonText}. This assessment is provided for
            documentation purposes only. Board waiver NOT permitted per ESG and Responsible Use Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
