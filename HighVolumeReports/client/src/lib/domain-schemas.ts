export interface DomainColumn {
  key: string;
  label: string;
  type: "text" | "number" | "currency" | "date" | "status" | "badge";
  width?: number;
}

export interface DomainSchema {
  id: string;
  name: string;
  description: string;
  columns: DomainColumn[];
  statusValues: string[];
  entityLabel: string;
}

export const DOMAIN_SCHEMAS: Record<string, DomainSchema> = {
  telecom: {
    id: "telecom",
    name: "Telecom CDRs",
    description: "Call Detail Records - calls, SMS, data sessions",
    entityLabel: "Subscriber",
    statusValues: ["COMPLETED", "DROPPED", "FAILED", "ROAMING"],
    columns: [
      { key: "recordId", label: "CDR ID", type: "text", width: 120 },
      { key: "timestamp", label: "Timestamp", type: "date", width: 160 },
      { key: "region", label: "Region", type: "text", width: 100 },
      { key: "callType", label: "Type", type: "badge", width: 80 },
      { key: "duration", label: "Duration (sec)", type: "number", width: 100 },
      { key: "dataUsage", label: "Data (MB)", type: "number", width: 90 },
      { key: "amount", label: "Charge (₱)", type: "currency", width: 100 },
      { key: "status", label: "Status", type: "status", width: 100 },
      { key: "subscriber", label: "Subscriber", type: "text", width: 120 },
    ],
  },
  ecommerce: {
    id: "ecommerce",
    name: "E-commerce Ledger",
    description: "Orders, refunds, shipments across regions",
    entityLabel: "Customer",
    statusValues: ["CLEARED", "PENDING", "FAILED", "REFUNDED"],
    columns: [
      { key: "transactionId", label: "Order ID", type: "text", width: 130 },
      { key: "timestamp", label: "Order Date", type: "date", width: 160 },
      { key: "region", label: "Region", type: "text", width: 100 },
      { key: "type", label: "Type", type: "badge", width: 90 },
      { key: "amount", label: "Amount (₱)", type: "currency", width: 110 },
      { key: "status", label: "Status", type: "status", width: 100 },
      { key: "customer", label: "Customer", type: "text", width: 120 },
    ],
  },
  banking: {
    id: "banking",
    name: "Banking/FinTech",
    description: "Ledger movements, reconciliations, AML audit trails",
    entityLabel: "Account",
    statusValues: ["POSTED", "PENDING", "REVERSED", "FLAGGED"],
    columns: [
      { key: "transactionId", label: "Ref No.", type: "text", width: 130 },
      { key: "timestamp", label: "Value Date", type: "date", width: 160 },
      { key: "region", label: "Branch", type: "text", width: 100 },
      { key: "type", label: "Txn Type", type: "badge", width: 100 },
      { key: "debit", label: "Debit (₱)", type: "currency", width: 110 },
      { key: "credit", label: "Credit (₱)", type: "currency", width: 110 },
      { key: "balance", label: "Balance (₱)", type: "currency", width: 120 },
      { key: "status", label: "Status", type: "status", width: 90 },
      { key: "customer", label: "Account", type: "text", width: 120 },
    ],
  },
  government: {
    id: "government",
    name: "Government Census/Tax",
    description: "Per-barangay rollups, taxpayer ledgers",
    entityLabel: "Taxpayer",
    statusValues: ["FILED", "PENDING", "DELINQUENT", "EXEMPT"],
    columns: [
      { key: "transactionId", label: "Filing ID", type: "text", width: 130 },
      { key: "timestamp", label: "Filing Date", type: "date", width: 160 },
      { key: "region", label: "Municipality", type: "text", width: 120 },
      { key: "barangay", label: "Barangay", type: "text", width: 120 },
      { key: "type", label: "Tax Type", type: "badge", width: 100 },
      { key: "amount", label: "Amount (₱)", type: "currency", width: 110 },
      { key: "status", label: "Status", type: "status", width: 100 },
      { key: "customer", label: "Taxpayer TIN", type: "text", width: 130 },
    ],
  },
  healthcare: {
    id: "healthcare",
    name: "Healthcare Claims",
    description: "Claims per insurer/hospital with diagnosis codes",
    entityLabel: "Patient",
    statusValues: ["APPROVED", "PENDING", "DENIED", "PARTIAL"],
    columns: [
      { key: "transactionId", label: "Claim ID", type: "text", width: 130 },
      { key: "timestamp", label: "Service Date", type: "date", width: 160 },
      { key: "region", label: "Facility", type: "text", width: 120 },
      { key: "diagnosisCode", label: "ICD-10", type: "text", width: 90 },
      { key: "procedureCode", label: "CPT Code", type: "text", width: 90 },
      { key: "amount", label: "Billed (₱)", type: "currency", width: 110 },
      { key: "approved", label: "Approved (₱)", type: "currency", width: 110 },
      { key: "status", label: "Status", type: "status", width: 90 },
      { key: "customer", label: "Member ID", type: "text", width: 120 },
    ],
  },
  education: {
    id: "education",
    name: "Education LMS",
    description: "Course events, submissions, grading audits",
    entityLabel: "Student",
    statusValues: ["SUBMITTED", "GRADED", "LATE", "MISSING"],
    columns: [
      { key: "transactionId", label: "Event ID", type: "text", width: 130 },
      { key: "timestamp", label: "Event Time", type: "date", width: 160 },
      { key: "region", label: "Campus", type: "text", width: 100 },
      { key: "courseCode", label: "Course", type: "text", width: 100 },
      { key: "type", label: "Activity", type: "badge", width: 100 },
      { key: "score", label: "Score", type: "number", width: 80 },
      { key: "maxScore", label: "Max", type: "number", width: 70 },
      { key: "status", label: "Status", type: "status", width: 90 },
      { key: "customer", label: "Student ID", type: "text", width: 120 },
    ],
  },
  logistics: {
    id: "logistics",
    name: "Transportation/Logistics",
    description: "GPS pings, waybills, delivery scans",
    entityLabel: "Shipment",
    statusValues: ["DELIVERED", "IN_TRANSIT", "DELAYED", "RETURNED"],
    columns: [
      { key: "transactionId", label: "Waybill No.", type: "text", width: 130 },
      { key: "timestamp", label: "Scan Time", type: "date", width: 160 },
      { key: "region", label: "Hub", type: "text", width: 100 },
      { key: "origin", label: "Origin", type: "text", width: 100 },
      { key: "destination", label: "Destination", type: "text", width: 100 },
      { key: "weight", label: "Weight (kg)", type: "number", width: 90 },
      { key: "amount", label: "Freight (₱)", type: "currency", width: 100 },
      { key: "status", label: "Status", type: "status", width: 100 },
      { key: "customer", label: "Consignee", type: "text", width: 120 },
    ],
  },
  manufacturing: {
    id: "manufacturing",
    name: "Manufacturing/IoT",
    description: "Sensor readings, QC inspections, downtime logs",
    entityLabel: "Equipment",
    statusValues: ["NORMAL", "WARNING", "CRITICAL", "OFFLINE"],
    columns: [
      { key: "transactionId", label: "Reading ID", type: "text", width: 130 },
      { key: "timestamp", label: "Timestamp", type: "date", width: 160 },
      { key: "region", label: "Plant", type: "text", width: 100 },
      { key: "equipmentId", label: "Equipment", type: "text", width: 110 },
      { key: "sensorType", label: "Sensor", type: "badge", width: 100 },
      { key: "value", label: "Reading", type: "number", width: 90 },
      { key: "threshold", label: "Threshold", type: "number", width: 90 },
      { key: "status", label: "Status", type: "status", width: 90 },
      { key: "customer", label: "Line ID", type: "text", width: 100 },
    ],
  },
  cybersecurity: {
    id: "cybersecurity",
    name: "Cybersecurity/SIEM",
    description: "Auth events, firewall logs, vulnerability findings",
    entityLabel: "Asset",
    statusValues: ["ALLOWED", "BLOCKED", "ALERT", "CRITICAL"],
    columns: [
      { key: "transactionId", label: "Event ID", type: "text", width: 140 },
      { key: "timestamp", label: "Event Time", type: "date", width: 160 },
      { key: "region", label: "Zone", type: "text", width: 90 },
      { key: "sourceIP", label: "Source IP", type: "text", width: 120 },
      { key: "destIP", label: "Dest IP", type: "text", width: 120 },
      { key: "eventType", label: "Event Type", type: "badge", width: 100 },
      { key: "severity", label: "Severity", type: "number", width: 80 },
      { key: "status", label: "Action", type: "status", width: 90 },
      { key: "customer", label: "Asset ID", type: "text", width: 110 },
    ],
  },
  energy: {
    id: "energy",
    name: "Energy/Utilities",
    description: "Smart meter readings by feeder/transformer",
    entityLabel: "Meter",
    statusValues: ["NORMAL", "HIGH", "LOW", "TAMPERED"],
    columns: [
      { key: "transactionId", label: "Reading ID", type: "text", width: 130 },
      { key: "timestamp", label: "Read Time", type: "date", width: 160 },
      { key: "region", label: "District", type: "text", width: 100 },
      { key: "feeder", label: "Feeder", type: "text", width: 100 },
      { key: "meterNo", label: "Meter No.", type: "text", width: 110 },
      { key: "kwhReading", label: "kWh", type: "number", width: 90 },
      { key: "amount", label: "Bill (₱)", type: "currency", width: 100 },
      { key: "status", label: "Status", type: "status", width: 90 },
      { key: "customer", label: "Account", type: "text", width: 110 },
    ],
  },
  insurance: {
    id: "insurance",
    name: "Insurance Policies",
    description: "Policy lifecycle, claims, reserves, payouts",
    entityLabel: "Policyholder",
    statusValues: ["ACTIVE", "LAPSED", "CLAIMED", "SETTLED"],
    columns: [
      { key: "transactionId", label: "Policy/Claim No.", type: "text", width: 140 },
      { key: "timestamp", label: "Effective Date", type: "date", width: 160 },
      { key: "region", label: "Branch", type: "text", width: 100 },
      { key: "type", label: "Product", type: "badge", width: 100 },
      { key: "premium", label: "Premium (₱)", type: "currency", width: 110 },
      { key: "sumInsured", label: "Sum Insured (₱)", type: "currency", width: 130 },
      { key: "claimAmount", label: "Claim (₱)", type: "currency", width: 100 },
      { key: "status", label: "Status", type: "status", width: 90 },
      { key: "customer", label: "Policyholder", type: "text", width: 120 },
    ],
  },
  adtech: {
    id: "adtech",
    name: "AdTech/Analytics",
    description: "Impressions, clicks, conversions, spend",
    entityLabel: "Campaign",
    statusValues: ["ACTIVE", "PAUSED", "COMPLETED", "OPTIMIZING"],
    columns: [
      { key: "transactionId", label: "Event ID", type: "text", width: 130 },
      { key: "timestamp", label: "Event Time", type: "date", width: 160 },
      { key: "region", label: "Geo", type: "text", width: 90 },
      { key: "campaign", label: "Campaign", type: "text", width: 120 },
      { key: "channel", label: "Channel", type: "badge", width: 90 },
      { key: "impressions", label: "Impressions", type: "number", width: 100 },
      { key: "clicks", label: "Clicks", type: "number", width: 80 },
      { key: "conversions", label: "Conversions", type: "number", width: 100 },
      { key: "amount", label: "Spend (₱)", type: "currency", width: 100 },
      { key: "status", label: "Status", type: "status", width: 90 },
    ],
  },
};

export function getDomainSchema(domainId: string): DomainSchema {
  return DOMAIN_SCHEMAS[domainId] || DOMAIN_SCHEMAS.ecommerce;
}

export function getDomainColumns(domainId: string): DomainColumn[] {
  return getDomainSchema(domainId).columns;
}
