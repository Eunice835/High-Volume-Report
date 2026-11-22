import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc, and, gte, lte, inArray, sql, count } from "drizzle-orm";
import { 
  transactions, 
  jobs, 
  schedules,
  users,
  type Transaction,
  type InsertTransaction,
  type Job,
  type InsertJob,
  type Schedule,
  type InsertSchedule,
  type User,
  type InsertUser
} from "@shared/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = neon(databaseUrl);
export const db = drizzle(client);

// Storage interface
export interface IStorage {
  // Transactions
  getTransactions(filters: {
    limit?: number;
    offset?: number;
    regions?: string[];
    startDate?: Date;
    endDate?: Date;
    type?: string;
    status?: string;
  }): Promise<{ data: Transaction[]; total: number }>;
  
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  bulkInsertTransactions(transactions: InsertTransaction[]): Promise<void>;
  
  // Jobs
  getJobs(limit?: number): Promise<Job[]>;
  getJobById(jobId: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(jobId: string, updates: Partial<Job>): Promise<Job | undefined>;
  
  // Schedules
  getSchedules(): Promise<Schedule[]>;
  getScheduleById(scheduleId: string): Promise<Schedule | undefined>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(scheduleId: string, updates: Partial<Schedule>): Promise<Schedule | undefined>;
  
  // Utility
  getTransactionCount(
    startDate?: Date,
    endDate?: Date,
    regions?: string[],
    status?: string,
    type?: string
  ): Promise<number>;
  
  // Job management
  deleteFailedJobs(): Promise<number>;
  recoverStuckJobs(stuckThresholdMinutes: number): Promise<{ jobId: string; totalRows: number }[]>;
  
  // Users
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // Transactions
  async getTransactions(filters: {
    limit?: number;
    offset?: number;
    regions?: string[];
    startDate?: Date;
    endDate?: Date;
    type?: string;
    status?: string;
  }): Promise<{ data: Transaction[]; total: number }> {
    const { limit = 50, offset = 0, regions, startDate, endDate, type, status } = filters;
    
    // Build WHERE conditions
    const conditions = [];
    
    if (regions && regions.length > 0) {
      conditions.push(inArray(transactions.region, regions));
    }
    
    if (startDate) {
      conditions.push(gte(transactions.timestamp, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(transactions.timestamp, endDate));
    }
    
    if (type) {
      conditions.push(eq(transactions.type, type as any));
    }
    
    if (status) {
      conditions.push(eq(transactions.status, status as any));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(transactions)
      .where(whereClause);
    
    // Get paginated data
    const data = await db
      .select()
      .from(transactions)
      .where(whereClause)
      .orderBy(desc(transactions.timestamp))
      .limit(limit)
      .offset(offset);
    
    return {
      data,
      total: Number(totalResult.count),
    };
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }
  
  async bulkInsertTransactions(transactionList: InsertTransaction[]): Promise<void> {
    // Insert in batches of 1000 to avoid parameter limits
    const batchSize = 1000;
    for (let i = 0; i < transactionList.length; i += batchSize) {
      const batch = transactionList.slice(i, i + batchSize);
      await db.insert(transactions).values(batch);
    }
  }
  
  // Jobs
  async getJobs(limit: number = 50): Promise<Job[]> {
    return db
      .select()
      .from(jobs)
      .orderBy(desc(jobs.submittedAt))
      .limit(limit);
  }
  
  async getJobById(jobId: string): Promise<Job | undefined> {
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.jobId, jobId))
      .limit(1);
    return job;
  }
  
  async createJob(job: InsertJob): Promise<Job> {
    const [created] = await db.insert(jobs).values(job).returning();
    return created;
  }
  
  async updateJob(jobId: string, updates: Partial<Job>): Promise<Job | undefined> {
    const [updated] = await db
      .update(jobs)
      .set(updates)
      .where(eq(jobs.jobId, jobId))
      .returning();
    return updated;
  }
  
  // Schedules
  async getSchedules(): Promise<Schedule[]> {
    return db
      .select()
      .from(schedules)
      .where(eq(schedules.isActive, 1))
      .orderBy(desc(schedules.createdAt));
  }
  
  async getScheduleById(scheduleId: string): Promise<Schedule | undefined> {
    const [schedule] = await db
      .select()
      .from(schedules)
      .where(eq(schedules.scheduleId, scheduleId))
      .limit(1);
    return schedule;
  }
  
  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const [created] = await db.insert(schedules).values(schedule).returning();
    return created;
  }
  
  async updateSchedule(scheduleId: string, updates: Partial<Schedule>): Promise<Schedule | undefined> {
    const [updated] = await db
      .update(schedules)
      .set(updates)
      .where(eq(schedules.scheduleId, scheduleId))
      .returning();
    return updated;
  }
  
  // Utility
  async getTransactionCount(
    startDate?: Date,
    endDate?: Date,
    regions?: string[],
    status?: string,
    type?: string
  ): Promise<number> {
    const conditions = [];
    
    if (startDate) {
      conditions.push(gte(transactions.timestamp, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(transactions.timestamp, endDate));
    }
    
    if (regions && regions.length > 0) {
      conditions.push(inArray(transactions.region, regions));
    }
    
    if (status) {
      conditions.push(eq(transactions.status, status as any));
    }
    
    if (type) {
      conditions.push(eq(transactions.type, type as any));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [result] = await db
      .select({ count: count() })
      .from(transactions)
      .where(whereClause);
    
    return Number(result.count);
  }
  
  // Job management
  async deleteFailedJobs(): Promise<number> {
    const result = await db
      .delete(jobs)
      .where(eq(jobs.status, "failed"))
      .returning();
    return result.length;
  }
  
  async recoverStuckJobs(stuckThresholdMinutes: number): Promise<{ jobId: string; totalRows: number }[]> {
    const thresholdTime = new Date(Date.now() - stuckThresholdMinutes * 60 * 1000);
    
    // Find jobs that are stuck in "processing" status for too long
    const stuckJobs = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.status, "processing"),
          lte(jobs.startedAt, thresholdTime)
        )
      );
    
    if (stuckJobs.length === 0) {
      return [];
    }
    
    const recoveredJobs: { jobId: string; totalRows: number }[] = [];
    
    // Reset stuck jobs to "queued" status so they can be retried
    for (const job of stuckJobs) {
      await db
        .update(jobs)
        .set({
          status: "queued",
          progress: 0,
          processedRows: 0,
          startedAt: null,
          errorMessage: "Job was stuck and has been reset for retry.",
        })
        .where(eq(jobs.jobId, job.jobId));
      
      recoveredJobs.push({ jobId: job.jobId, totalRows: job.totalRows || 50000 });
    }
    
    return recoveredJobs;
  }
  
  // Users
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }
  
  async updateUserLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }
}

export const storage = new DatabaseStorage();
