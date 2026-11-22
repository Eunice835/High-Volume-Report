import { addDays, subDays, format } from "date-fns";

export type ReportType = "detail" | "summary" | "exception" | "booklet";
export type ExportFormat = "pdf" | "xlsx";
export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface ReportJob {
  id: string;
  name: string;
  type: ReportType;
  format: ExportFormat;
  status: JobStatus;
  progress: number;
  totalRows: number;
  processedRows: number;
  submittedAt: string;
  completedAt?: string;
  size?: string;
  downloadUrl?: string;
}

export interface Transaction {
  id: string;
  timestamp: string;
  region: string;
  type: "ORDER" | "REFUND" | "ADJUSTMENT" | "FEE";
  amount: number;
  status: "CLEARED" | "PENDING" | "FAILED";
  customer: string;
}

export interface Schedule {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  nextRun: string;
  recipients: string[];
  format: ExportFormat;
  status: "active" | "paused";
}

export const MOCK_SCHEDULES: Schedule[] = [
  {
    id: "sch-1",
    name: "Daily Transaction Rollup",
    frequency: "daily",
    nextRun: addDays(new Date(), 1).toISOString(),
    recipients: ["finance@nexus.com", "cfo@nexus.com"],
    format: "pdf",
    status: "active"
  },
  {
    id: "sch-2",
    name: "Weekly Regional Performance",
    frequency: "weekly",
    nextRun: addDays(new Date(), 3).toISOString(),
    recipients: ["regional_managers@nexus.com"],
    format: "xlsx",
    status: "active"
  }
];

export const MOCK_JOBS: ReportJob[] = [
  {
    id: "job-1234",
    name: "E-commerce Monthly Ledger (Jan 2025)",
    type: "detail",
    format: "pdf",
    status: "completed",
    progress: 100,
    totalRows: 1542000,
    processedRows: 1542000,
    submittedAt: subDays(new Date(), 1).toISOString(),
    completedAt: subDays(new Date(), 1).toISOString(),
    size: "450 MB",
    downloadUrl: "#",
  },
  {
    id: "job-5678",
    name: "Q4 2024 Region Summary",
    type: "summary",
    format: "xlsx",
    status: "processing",
    progress: 45,
    totalRows: 5000000,
    processedRows: 2250000,
    submittedAt: new Date().toISOString(),
  },
  {
    id: "job-9012",
    name: "Fraud Exception Report",
    type: "exception",
    format: "pdf",
    status: "queued",
    progress: 0,
    totalRows: 0,
    processedRows: 0,
    submittedAt: new Date().toISOString(),
  },
  {
    id: "job-3456",
    name: "Customer Audit Logs",
    type: "booklet",
    format: "pdf",
    status: "failed",
    progress: 12,
    totalRows: 12000,
    processedRows: 1440,
    submittedAt: subDays(new Date(), 2).toISOString(),
  },
];

export const REGIONS = ["North America", "Europe", "APAC", "LATAM", "EMEA", "Asia"];
export const TRANSACTION_TYPES = ["ORDER", "REFUND", "ADJUSTMENT", "FEE"];

// Store for dynamically created jobs
let dynamicJobs: ReportJob[] = [];

export function createNewJob(name: string, type: ReportType, format: ExportFormat, totalRows: number): ReportJob {
  const newJob: ReportJob = {
    id: `job-${Date.now()}`,
    name,
    type,
    format,
    status: "queued",
    progress: 0,
    totalRows,
    processedRows: 0,
    submittedAt: new Date().toISOString(),
  };
  
  dynamicJobs.unshift(newJob);
  
  // Simulate job processing
  setTimeout(() => {
    updateJobProgress(newJob.id, "processing", 25);
  }, 2000);
  
  setTimeout(() => {
    updateJobProgress(newJob.id, "processing", 60);
  }, 5000);
  
  setTimeout(() => {
    updateJobProgress(newJob.id, "completed", 100);
  }, 8000);
  
  return newJob;
}

function updateJobProgress(jobId: string, status: JobStatus, progress: number) {
  const job = dynamicJobs.find(j => j.id === jobId);
  if (job) {
    job.status = status;
    job.progress = progress;
    job.processedRows = Math.floor((job.totalRows * progress) / 100);
    
    if (status === "completed") {
      job.completedAt = new Date().toISOString();
      job.size = `${Math.floor(job.totalRows / 3000)} MB`;
      job.downloadUrl = "#";
    }
  }
}

export function getAllJobs(): ReportJob[] {
  return [...dynamicJobs, ...MOCK_JOBS];
}

// Generate deterministic mock data
export const generateTransactions = (count: number): Transaction[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `TXN-${500000 + i}`,
    timestamp: subDays(new Date(), i % 30).toISOString(),
    region: REGIONS[i % REGIONS.length],
    type: TRANSACTION_TYPES[i % TRANSACTION_TYPES.length] as any,
    amount: (Math.random() * 1000).toFixed(2) as any,
    status: i % 20 === 0 ? "FAILED" : i % 10 === 0 ? "PENDING" : "CLEARED",
    customer: `CUST-${1000 + (i % 500)}`,
  }));
};
