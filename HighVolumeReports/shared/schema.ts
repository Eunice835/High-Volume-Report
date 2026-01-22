import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, pgEnum, serial, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const transactionTypeEnum = pgEnum("transaction_type", ["ORDER", "REFUND", "ADJUSTMENT", "FEE"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["CLEARED", "PENDING", "FAILED"]);
export const jobStatusEnum = pgEnum("job_status", ["queued", "processing", "completed", "failed"]);
export const reportTypeEnum = pgEnum("report_type", ["detail", "summary", "exception", "booklet"]);
export const exportFormatEnum = pgEnum("export_format", ["pdf", "xlsx"]);
export const scheduleFrequencyEnum = pgEnum("schedule_frequency", ["daily", "weekly", "monthly"]);
export const userRoleEnum = pgEnum("user_role", ["admin", "analyst", "viewer"]);

// Core transaction table (main fact table)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 50 }).notNull().unique(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  region: varchar("region", { length: 100 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: transactionStatusEnum("status").notNull().default("PENDING"),
  customer: varchar("customer", { length: 50 }).notNull(),
}, (table) => {
  return {
    timestampIdx: index("timestamp_idx").on(table.timestamp.desc()),
    regionTimestampIdx: index("region_timestamp_idx").on(table.region, table.timestamp.desc()),
    customerIdx: index("customer_idx").on(table.customer),
    statusIdx: index("status_idx").on(table.status),
  };
});

// Export jobs table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  jobId: varchar("job_id", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: reportTypeEnum("type").notNull(),
  format: exportFormatEnum("format").notNull(),
  status: jobStatusEnum("status").notNull().default("queued"),
  progress: integer("progress").notNull().default(0),
  totalRows: integer("total_rows").notNull().default(0),
  processedRows: integer("processed_rows").notNull().default(0),
  filters: text("filters"), // JSON serialized filters
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  fileSize: varchar("file_size", { length: 50 }),
  downloadUrl: text("download_url"),
  errorMessage: text("error_message"),
}, (table) => {
  return {
    statusIdx: index("job_status_idx").on(table.status),
    submittedAtIdx: index("job_submitted_at_idx").on(table.submittedAt.desc()),
  };
});

// Scheduled reports
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  scheduleId: varchar("schedule_id", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  frequency: scheduleFrequencyEnum("frequency").notNull(),
  nextRun: timestamp("next_run", { withTimezone: true }).notNull(),
  recipients: text("recipients").notNull(), // JSON array
  format: exportFormatEnum("format").notNull(),
  reportType: reportTypeEnum("report_type").notNull(),
  filters: text("filters"), // JSON serialized filters
  isActive: integer("is_active").notNull().default(1), // SQLite-style boolean
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Users table for authentication and RBAC
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("viewer"),
  isActive: integer("is_active").notNull().default(1),
  lastLogin: timestamp("last_login", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    emailIdx: index("user_email_idx").on(table.email),
    usernameIdx: index("user_username_idx").on(table.username),
  };
});

// Session table for connect-pg-simple (standard schema)
export const sessions = pgTable("session", {
  sid: varchar("sid", { length: 255 }).primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire", { withTimezone: true }).notNull(),
}, (table) => {
  return {
    expireIdx: index("session_expire_idx").on(table.expire),
  };
});

// Zod schemas for validation
export const insertTransactionSchema = createInsertSchema(transactions, {
  amount: z.string().or(z.number()).transform((val) => String(val)),
  timestamp: z.string().or(z.date()).optional(),
}).omit({ id: true });

export const insertJobSchema = createInsertSchema(jobs, {
  progress: z.number().min(0).max(100).optional(),
  filters: z.string().optional(),
}).omit({ id: true });

export const insertScheduleSchema = createInsertSchema(schedules, {
  recipients: z.string(),
  filters: z.string().optional(),
}).omit({ id: true });

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastLogin: true });

// Types
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserRole = "admin" | "analyst" | "viewer";
