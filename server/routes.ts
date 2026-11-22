import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  emitJobNotification, 
  sendEmailNotification, 
  createJobCompletedEmail, 
  createJobFailedEmail 
} from "./notifications";
import { requireAuth, requireRole, csrfProtection } from "./auth";

// Request validation schemas
const previewRequestSchema = z.object({
  reportType: z.enum(["detail", "summary", "exception", "booklet"]).optional(),
  dateRange: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional(),
  regions: z.array(z.string()).optional(),
  format: z.enum(["pdf", "xlsx"]).optional(),
  page: z.number().default(1),
  pageSize: z.number().default(50),
});

const exportRequestSchema = z.object({
  reportType: z.enum(["detail", "summary", "exception", "booklet"]),
  dateRange: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional(),
  regions: z.array(z.string()).optional(),
  format: z.enum(["pdf", "xlsx"]),
});

const scheduleRequestSchema = z.object({
  name: z.string(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  recipients: z.array(z.string()),
  format: z.enum(["pdf", "xlsx"]),
  reportType: z.enum(["detail", "summary", "exception", "booklet"]),
  filters: z.any().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Preview endpoint - fast data retrieval for UI
  app.post("/api/reports/preview", requireAuth, csrfProtection, async (req, res) => {
    try {
      const body = previewRequestSchema.parse(req.body);
      console.log("Preview request body:", JSON.stringify(body, null, 2));
      
      const { page, pageSize, regions, dateRange } = body;
      const offset = (page - 1) * pageSize;
      
      const filters: any = {
        limit: pageSize,
        offset,
      };
      
      if (regions && regions.length > 0) {
        filters.regions = regions;
      }
      
      // Only apply date filter if a valid date range is provided and it's not just "today"
      if (dateRange?.from) {
        const fromDate = new Date(dateRange.from);
        const toDate = dateRange.to ? new Date(dateRange.to) : new Date();
        
        // Set from to start of day and to to end of day
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        
        filters.startDate = fromDate;
        filters.endDate = toDate;
      }
      
      console.log("Applying filters:", JSON.stringify(filters, null, 2));
      const result = await storage.getTransactions(filters);
      console.log("Query result count:", result.total);
      
      return res.json({
        data: result.data,
        total: result.total,
        page,
        pageSize,
        totalPages: Math.ceil(result.total / pageSize),
      });
    } catch (error) {
      console.error("Preview error:", error);
      return res.status(400).json({ error: "Invalid request parameters" });
    }
  });
  
  // Helper function to simulate job processing - used for new jobs and recovered jobs
  const startJobProcessing = async (jobId: string, rowCount: number, skipQueueDelay = false) => {
    const actualRowCount = rowCount || 50000;
    const willFail = Math.random() < 0.2; // 20% failure rate
    
    const processJob = async () => {
      // Stage 2: Move to "processing" at 10%
      await storage.updateJob(jobId, {
        status: "processing",
        startedAt: new Date(),
        progress: 10,
        totalRows: actualRowCount,
        processedRows: Math.floor(actualRowCount * 0.1),
        errorMessage: null, // Clear any previous error
      });
      
      // Stage 3: Progress to 30% after 2 seconds
      setTimeout(async () => {
        await storage.updateJob(jobId, { 
          progress: 30,
          processedRows: Math.floor(actualRowCount * 0.3),
        });
        
        // Stage 4: Progress to 50-60% after 2 more seconds
        setTimeout(async () => {
          await storage.updateJob(jobId, { 
            progress: willFail ? 35 : 60,
            processedRows: willFail ? Math.floor(actualRowCount * 0.35) : Math.floor(actualRowCount * 0.6),
          });
          
          // Stage 5: Progress to 80% or fail after 2 more seconds
          setTimeout(async () => {
            if (willFail) {
              const errorMessage = "Memory limit exceeded while processing large dataset. Consider reducing date range or splitting into smaller exports.";
              await storage.updateJob(jobId, {
                status: "failed",
                progress: 35,
                completedAt: new Date(),
                processedRows: Math.floor(actualRowCount * 0.35),
                errorMessage,
              });
              
              const job = await storage.getJobById(jobId);
              emitJobNotification({
                type: "job_failed",
                jobId,
                jobName: job?.name,
                message: errorMessage,
                timestamp: new Date(),
              });
              
              if (job?.filters) {
                try {
                  const filters = JSON.parse(job.filters);
                  if (filters.email) {
                    await sendEmailNotification(
                      filters.email,
                      `Export Failed: ${job.name}`,
                      createJobFailedEmail(job.name, errorMessage)
                    );
                  }
                } catch (e) {}
              }
            } else {
              await storage.updateJob(jobId, { 
                progress: 85,
                processedRows: Math.floor(actualRowCount * 0.85),
              });
              
              emitJobNotification({
                type: "job_progress",
                jobId,
                progress: 85,
                timestamp: new Date(),
              });
              
              // Stage 6: Complete after 2 more seconds
              setTimeout(async () => {
                const fileSizeMB = (actualRowCount * 0.0003).toFixed(1);
                const downloadUrl = `/api/downloads/${jobId}`;
                await storage.updateJob(jobId, {
                  status: "completed",
                  progress: 100,
                  completedAt: new Date(),
                  processedRows: actualRowCount,
                  fileSize: `${fileSizeMB} MB`,
                  downloadUrl,
                });
                
                const job = await storage.getJobById(jobId);
                emitJobNotification({
                  type: "job_completed",
                  jobId,
                  jobName: job?.name,
                  downloadUrl,
                  timestamp: new Date(),
                });
                
                if (job?.filters) {
                  try {
                    const filters = JSON.parse(job.filters);
                    if (filters.email) {
                      await sendEmailNotification(
                        filters.email,
                        `Export Complete: ${job.name}`,
                        createJobCompletedEmail(job.name, downloadUrl)
                      );
                    }
                  } catch (e) {}
                }
              }, 2000);
            }
          }, 2000);
        }, 2000);
      }, 2000);
    };
    
    if (skipQueueDelay) {
      // For recovered jobs, start processing immediately
      processJob();
    } else {
      // For new jobs, stay in "queued" for 5 seconds so users can see the status
      setTimeout(processJob, 5000);
    }
  };

  // Export endpoint - queue async job (analyst or admin)
  app.post("/api/reports/exports", requireRole("admin", "analyst"), csrfProtection, async (req, res) => {
    try {
      const body = exportRequestSchema.parse(req.body);
      
      // Create a new job
      const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const job = await storage.createJob({
        jobId,
        name: `${body.reportType} Report - ${new Date().toISOString().split('T')[0]}`,
        type: body.reportType,
        format: body.format,
        status: "queued",
        progress: 0,
        totalRows: 0,
        processedRows: 0,
        filters: JSON.stringify(body),
        submittedAt: new Date(),
      });
      
      // Get actual row count based on filters (use all selected regions)
      const actualRowCount = await storage.getTransactionCount(
        body.dateRange?.from ? new Date(body.dateRange.from) : undefined,
        body.dateRange?.to ? new Date(body.dateRange.to) : undefined,
        body.regions,
        undefined,
        undefined
      );
      
      // Start job processing
      startJobProcessing(jobId, actualRowCount, false);
      
      return res.json({
        jobId: job.jobId,
        status: job.status,
        message: "Export job queued successfully",
      });
    } catch (error) {
      console.error("Export error:", error);
      return res.status(400).json({ error: "Invalid request parameters" });
    }
  });
  
  // Get job status
  app.get("/api/reports/exports/:jobId", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.getJobById(jobId);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      return res.json(job);
    } catch (error) {
      console.error("Get job error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Download completed export
  app.get("/api/downloads/:jobId", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.getJobById(jobId);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      if (job.status !== "completed") {
        return res.status(400).json({ error: "Export not ready for download" });
      }
      
      // Parse the stored filters
      const filters = job.filters ? JSON.parse(job.filters) : {};
      
      // Fetch actual data based on filters
      const { data } = await storage.getTransactions({
        limit: 10000, // Limit for demo
        regions: filters.regions,
        startDate: filters.dateRange?.from ? new Date(filters.dateRange.from) : undefined,
        endDate: filters.dateRange?.to ? new Date(filters.dateRange.to) : undefined,
      });
      
      if (job.format === "xlsx" || filters.format === "xlsx") {
        // Generate CSV for Excel (simplified - real implementation would use xlsx library)
        const headers = ["Transaction ID", "Timestamp", "Region", "Type", "Amount (PHP)", "Status", "Customer"];
        const rows = data.map(t => [
          t.transactionId,
          new Date(t.timestamp).toISOString(),
          t.region,
          t.type,
          t.amount,
          t.status,
          t.customer
        ]);
        
        const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${job.name.replace(/[^a-zA-Z0-9]/g, "_")}.csv"`);
        return res.send(csv);
      } else {
        // For PDF, generate a simple text report (real implementation would use PDFKit or similar)
        const reportContent = `
IRA ANALYTICS - ${job.type?.toUpperCase()} REPORT
Generated: ${new Date().toLocaleString()}
Report Name: ${job.name}
Total Records: ${job.totalRows?.toLocaleString()}

FILTERS APPLIED:
- Date Range: ${filters.dateRange?.from ? new Date(filters.dateRange.from).toLocaleDateString() : 'All'} to ${filters.dateRange?.to ? new Date(filters.dateRange.to).toLocaleDateString() : 'All'}
- Regions: ${filters.regions?.join(", ") || "All Regions"}

TRANSACTION DATA:
${"=".repeat(120)}
${["ID", "Timestamp", "Region", "Type", "Amount (PHP)", "Status", "Customer"].join(" | ")}
${"=".repeat(120)}
${data.slice(0, 100).map(t => 
  [t.transactionId, new Date(t.timestamp).toLocaleString(), t.region, t.type, `₱${parseFloat(t.amount).toLocaleString()}`, t.status, t.customer].join(" | ")
).join("\n")}
${data.length > 100 ? `\n... and ${data.length - 100} more records` : ""}

END OF REPORT
        `;
        
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Content-Disposition", `attachment; filename="${job.name.replace(/[^a-zA-Z0-9]/g, "_")}.txt"`);
        return res.send(reportContent);
      }
    } catch (error) {
      console.error("Download error:", error);
      return res.status(500).json({ error: "Failed to generate download" });
    }
  });

  // List all jobs
  app.get("/api/reports/exports", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const jobs = await storage.getJobs(limit);
      
      return res.json({
        jobs,
        total: jobs.length,
      });
    } catch (error) {
      console.error("List jobs error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Retry a failed job
  app.post("/api/reports/exports/:jobId/retry", requireRole("admin", "analyst"), csrfProtection, async (req, res) => {
    try {
      const { jobId } = req.params;
      const job = await storage.getJobById(jobId);
      
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      if (job.status !== "failed") {
        return res.status(400).json({ error: "Only failed jobs can be retried" });
      }
      
      // Reset the job to queued status
      await storage.updateJob(jobId, {
        status: "queued",
        progress: 0,
        processedRows: 0,
        startedAt: null,
        completedAt: null,
        errorMessage: null,
        fileSize: null,
        downloadUrl: null,
      });
      
      // Start processing the job
      console.log(`Retrying failed job: ${jobId} with ${job.totalRows} rows`);
      startJobProcessing(jobId, job.totalRows || 50000, false);
      
      return res.json({
        message: "Job retry started",
        jobId,
      });
    } catch (error) {
      console.error("Retry job error:", error);
      return res.status(500).json({ error: "Failed to retry job" });
    }
  });
  
  // Schedules
  app.get("/api/schedules", requireAuth, async (req, res) => {
    try {
      const schedules = await storage.getSchedules();
      return res.json({ schedules });
    } catch (error) {
      console.error("Get schedules error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/api/schedules", requireRole("admin"), csrfProtection, async (req, res) => {
    try {
      const body = scheduleRequestSchema.parse(req.body);
      
      const scheduleId = `sch-${Date.now()}`;
      
      const schedule = await storage.createSchedule({
        scheduleId,
        name: body.name,
        frequency: body.frequency,
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        recipients: JSON.stringify(body.recipients),
        format: body.format,
        reportType: body.reportType,
        filters: body.filters ? JSON.stringify(body.filters) : undefined,
        isActive: 1,
        createdAt: new Date(),
      });
      
      return res.json({
        message: "Schedule created successfully",
        schedule,
      });
    } catch (error) {
      console.error("Create schedule error:", error);
      return res.status(400).json({ error: "Invalid request parameters" });
    }
  });
  
  // Create a test stuck job (for testing recovery)
  app.post("/api/admin/create-stuck-job", requireRole("admin"), csrfProtection, async (req, res) => {
    try {
      const jobId = `job-stuck-${Date.now()}`;
      const stuckTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      
      await storage.createJob({
        jobId,
        name: `Test Stuck Job - ${new Date().toISOString().split('T')[0]}`,
        type: "detail",
        format: "pdf",
        status: "processing",
        progress: 45,
        totalRows: 10000,
        processedRows: 4500,
        filters: JSON.stringify({}),
        submittedAt: stuckTime,
        startedAt: stuckTime,
      });
      
      return res.json({
        message: "Created a test stuck job (started 5 min ago). Now click 'Recover Stuck Jobs' to test recovery.",
        jobId,
      });
    } catch (error) {
      console.error("Create stuck job error:", error);
      return res.status(500).json({ error: "Failed to create stuck job" });
    }
  });

  // Recover stuck jobs (called on startup and manually)
  app.post("/api/admin/recover-stuck-jobs", requireRole("admin"), csrfProtection, async (req, res) => {
    try {
      const recoveredJobs = await storage.recoverStuckJobs(2); // 2 minute threshold
      
      // Start processing each recovered job (skip queue delay since they were already waiting)
      for (const job of recoveredJobs) {
        console.log(`Starting recovered job: ${job.jobId} with ${job.totalRows} rows`);
        startJobProcessing(job.jobId, job.totalRows, true);
      }
      
      return res.json({
        message: recoveredJobs.length > 0 
          ? `Recovered ${recoveredJobs.length} stuck job(s) - now reprocessing`
          : "No stuck jobs found",
        recoveredCount: recoveredJobs.length,
      });
    } catch (error) {
      console.error("Recover stuck jobs error:", error);
      return res.status(500).json({ error: "Failed to recover stuck jobs" });
    }
  });

  // Purge failed jobs
  app.delete("/api/admin/failed-jobs", requireRole("admin"), csrfProtection, async (req, res) => {
    try {
      const deletedCount = await storage.deleteFailedJobs();
      return res.json({
        message: `Successfully purged ${deletedCount} failed job(s)`,
        deletedCount,
      });
    } catch (error) {
      console.error("Purge jobs error:", error);
      return res.status(500).json({ error: "Failed to purge jobs" });
    }
  });

  // System stats for admin dashboard
  app.get("/api/admin/stats", requireRole("admin"), async (req, res) => {
    try {
      const jobs = await storage.getJobs(100);
      const schedules = await storage.getSchedules();
      
      const failedJobs = jobs.filter(j => j.status === 'failed').length;
      const stats = {
        apiLatency: "124ms",
        octaneWorkers: { active: 24, total: 24 },
        deadLetterQueue: failedJobs,
        activeUsers: 18,
        queueDepth: jobs.filter(j => j.status === 'queued' || j.status === 'processing').length,
      };
      
      return res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
