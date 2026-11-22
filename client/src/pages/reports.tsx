import { useState } from "react";
import { Layout } from "@/components/layout";
import { ReportFilter } from "@/components/report-filter";
import { DataGrid } from "@/components/data-grid";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PreviewResponse {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ReportType = "detail" | "summary" | "exception" | "booklet";

export default function Reports() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [queryTime, setQueryTime] = useState(0);
  const [selectedDomain, setSelectedDomain] = useState("ecommerce");
  const [selectedReportType, setSelectedReportType] = useState<ReportType>("detail");
  const [_, setLocation] = useLocation();

  const previewMutation = useMutation({
    mutationFn: async (filters: any) => {
      const startTime = Date.now();
      
      // Build date range - only include if dates are actually selected
      let dateRange: { from?: string; to?: string } | undefined;
      if (filters.dateRange?.from) {
        dateRange = {
          from: filters.dateRange.from.toISOString(),
          to: filters.dateRange.to?.toISOString() || filters.dateRange.from.toISOString(),
        };
      }
      
      const response = await apiRequest("POST", "/api/reports/preview", {
        reportType: filters.reportType,
        dateRange,
        regions: filters.regions,
        format: filters.format,
        page: 1,
        pageSize: 5000,
      });
      const endTime = Date.now();
      setQueryTime(endTime - startTime);
      return response.json() as Promise<PreviewResponse>;
    },
    onSuccess: (result) => {
      setData(result.data.map((t: any) => ({
        ...t,
        id: t.transactionId || t.id,
        timestamp: typeof t.timestamp === 'string' ? t.timestamp : new Date(t.timestamp).toISOString(),
        amount: Number(t.amount),
      })));
      setTotal(result.total);
      setHasPreviewed(true);
      
      toast({
        title: "Preview Loaded",
        description: `Fetched ${result.data.length.toLocaleString()} rows in ${queryTime || 0}ms. Total: ${result.total.toLocaleString()} rows.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Preview Failed",
        description: "Could not load preview data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (filters: any) => {
      const response = await apiRequest("POST", "/api/reports/exports", {
        reportType: filters.reportType,
        dateRange: {
          from: filters.dateRange?.from?.toISOString(),
          to: filters.dateRange?.to?.toISOString(),
        },
        regions: filters.regions,
        format: filters.format,
      });
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Export Queued",
        description: `Job ${result.jobId} has been added to the queue. Redirecting...`,
      });

      setTimeout(() => {
        setLocation("/exports");
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: "Could not queue export job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePreview = async (filters: any) => {
    setIsLoading(true);
    setSelectedDomain(filters.domain || "ecommerce");
    setSelectedReportType(filters.reportType || "detail");
    previewMutation.mutate(filters, {
      onSettled: () => setIsLoading(false),
    });
  };

  const handleExport = (filters: any) => {
    exportMutation.mutate(filters);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Report Generator</h1>
            <p className="text-muted-foreground">Query the 100K+ record dataset and export to PDF/Excel.</p>
        </div>

        <ReportFilter onPreview={handlePreview} onExport={handleExport} />
        
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Result Preview</h2>
                {data.length > 0 && (
                    <span className="text-xs text-muted-foreground font-mono" data-testid="text-query-stats">
                        Query Execution: {(queryTime / 1000).toFixed(2)}s | Total Rows: {total.toLocaleString()}
                    </span>
                )}
            </div>
            <DataGrid data={data} isLoading={isLoading} total={total} domain={selectedDomain} reportType={selectedReportType} />
        </div>
      </div>
    </Layout>
  );
}
