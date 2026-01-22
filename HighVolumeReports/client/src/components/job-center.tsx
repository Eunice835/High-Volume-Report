import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, AlertCircle, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ReportJob {
  id: number;
  jobId: string;
  name: string;
  type: string;
  format: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  totalRows: number;
  processedRows: number;
  submittedAt: string;
  startedAt?: string;
  completedAt?: string;
  fileSize?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

export function JobCenter() {
  const queryClient = useQueryClient();

  const { data: jobsData, isLoading, refetch } = useQuery({
    queryKey: ["/api/reports/exports"],
    queryFn: async () => {
      const response = await fetch("/api/reports/exports");
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json() as Promise<{ jobs: ReportJob[]; total: number }>;
    },
    refetchInterval: 2000, // Poll every 2 seconds to catch queued state
    refetchOnMount: "always", // Always refetch when navigating to exports page
  });

  const jobs = jobsData?.jobs || [];
  
  const retryMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest("POST", `/api/reports/exports/${jobId}/retry`, {});
      if (!response.ok) throw new Error("Failed to retry job");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Retry Started",
        description: "The job has been queued for retry.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/exports"] });
    },
    onError: () => {
      toast({
        title: "Retry Failed",
        description: "Could not retry the job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "Job list has been updated.",
    });
  };

  return (
    <Card className="glass-panel h-full flex flex-col" data-testid="job-center">
      <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">Recent Exports</CardTitle>
        <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleRefresh}
              data-testid="button-refresh"
            >
                <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isLoading && "animate-spin")} />
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        {jobs.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground" data-testid="empty-jobs">
            No export jobs yet. Generate a report to get started.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {jobs.map((job) => (
              <div key={job.jobId} className="p-4 hover:bg-white/5 transition-colors group" data-testid={`job-item-${job.jobId}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{job.name}</span>
                          <Badge variant="secondary" className="text-[10px] h-5">{job.format.toUpperCase()}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">ID: {job.jobId} • {job.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      {job.status === 'completed' && job.downloadUrl && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 gap-1.5 text-xs border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
                            data-testid={`button-download-${job.jobId}`}
                            asChild
                          >
                              <a href={job.downloadUrl} download>
                                <Download className="h-3 w-3" />
                                Download
                                <ExternalLink className="h-3 w-3 ml-0.5" />
                              </a>
                          </Button>
                      )}
                      {job.status === 'failed' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            data-testid={`button-retry-${job.jobId}`}
                            onClick={() => retryMutation.mutate(job.jobId)}
                            disabled={retryMutation.isPending}
                          >
                              {retryMutation.isPending ? "Retrying..." : "Retry"}
                          </Button>
                      )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                          {job.status === 'completed' ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> :
                           job.status === 'processing' ? <RefreshCw className="h-3 w-3 text-primary animate-spin" /> :
                           job.status === 'queued' ? <Clock className="h-3 w-3 text-amber-500" /> :
                           <AlertCircle className="h-3 w-3 text-destructive" />
                          }
                          <span className="capitalize">{job.status}</span>
                      </div>
                      <span>{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} className={cn("h-1.5",
                      job.status === 'failed' ? "bg-destructive/20" : "bg-secondary"
                  )}>
                      <div
                          className={cn("h-full transition-all duration-500",
                              job.status === 'completed' ? "bg-emerald-500" :
                              job.status === 'failed' ? "bg-destructive" :
                              "bg-primary"
                          )}
                          style={{ width: `${job.progress}%` }}
                      />
                  </Progress>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{(job.processedRows || 0).toLocaleString()} / {(job.totalRows || 0).toLocaleString()} rows</span>
                      {job.fileSize && <span>{job.fileSize}</span>}
                  </div>
                  {job.status === 'failed' && job.errorMessage && (
                    <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20">
                      <p className="text-[10px] text-destructive font-medium">Error:</p>
                      <p className="text-[10px] text-destructive/80">{job.errorMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
