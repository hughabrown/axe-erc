/**
 * Audit Trail Download Component
 *
 * Provides download buttons for audit trail in JSON and CSV formats.
 */

'use client';

import { Button } from "@/components/ui/button";
import { Download, FileText, Sheet } from "lucide-react";
import { toast } from "sonner";

interface AuditTrailDownloadProps {
  assessmentId: string;
  customer: string;
}

export function AuditTrailDownload({ assessmentId, customer }: AuditTrailDownloadProps) {
  const downloadAuditTrail = async (format: 'json' | 'csv') => {
    try {
      toast.info(`Downloading audit trail as ${format.toUpperCase()}...`);

      const response = await fetch(`/api/audit-trail?id=${encodeURIComponent(assessmentId)}&format=${format}`);

      if (!response.ok) {
        throw new Error('Failed to fetch audit trail');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assessmentId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Audit trail downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to download audit trail:', error);
      toast.error('Failed to download audit trail');
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-md bg-muted/50">
      <div className="flex items-center gap-2 mb-2">
        <Download className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Audit Trail</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        Download complete audit trail with all queries, sources, and decisions for regulatory review.
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadAuditTrail('json')}
          className="flex-1"
        >
          <FileText className="h-4 w-4 mr-2" />
          JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadAuditTrail('csv')}
          className="flex-1"
        >
          <Sheet className="h-4 w-4 mr-2" />
          CSV
        </Button>
      </div>
    </div>
  );
}
