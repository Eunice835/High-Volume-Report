import { storage } from "./storage";
import type { InsertTransaction } from "@shared/schema";

const REGIONS = ["North America", "Europe", "APAC", "LATAM", "EMEA", "Asia"];
const TRANSACTION_TYPES = ["ORDER", "REFUND", "ADJUSTMENT", "FEE"] as const;
const STATUSES = ["CLEARED", "PENDING", "FAILED"] as const;

function generateTransaction(index: number): InsertTransaction {
  // Use current date and spread back over the past 90 days for realistic data
  const now = new Date();
  const daysBack = Math.floor(index / 1200); // Spread across ~90 days for 100k records
  const timestamp = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  
  // Add some variation within the day
  timestamp.setHours(Math.floor(Math.random() * 24));
  timestamp.setMinutes(Math.floor(Math.random() * 60));
  
  const statusRand = Math.random();
  const status = statusRand > 0.95 ? "FAILED" : statusRand > 0.85 ? "PENDING" : "CLEARED";
  
  return {
    transactionId: `TXN-${500000 + index}`,
    timestamp,
    region: REGIONS[index % REGIONS.length],
    type: TRANSACTION_TYPES[index % TRANSACTION_TYPES.length],
    amount: (Math.random() * 5000 + 10).toFixed(2),
    status,
    customer: `CUST-${1000 + (index % 500)}`,
  };
}

async function seed() {
  console.log("🌱 Starting database seed...");
  
  const TOTAL_RECORDS = 100000; // Start with 100k for faster testing
  const BATCH_SIZE = 5000;
  
  console.log(`📊 Generating ${TOTAL_RECORDS.toLocaleString()} transaction records...`);
  
  for (let i = 0; i < TOTAL_RECORDS; i += BATCH_SIZE) {
    const batch: InsertTransaction[] = [];
    const batchEnd = Math.min(i + BATCH_SIZE, TOTAL_RECORDS);
    
    for (let j = i; j < batchEnd; j++) {
      batch.push(generateTransaction(j));
    }
    
    await storage.bulkInsertTransactions(batch);
    
    const progress = ((batchEnd / TOTAL_RECORDS) * 100).toFixed(1);
    console.log(`   ✓ Inserted ${batchEnd.toLocaleString()} / ${TOTAL_RECORDS.toLocaleString()} (${progress}%)`);
  }
  
  console.log("✅ Seed completed successfully!");
  console.log(`   Total transactions: ${TOTAL_RECORDS.toLocaleString()}`);
  
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
