import { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getDomainColumns, getDomainSchema, DomainColumn } from "@/lib/domain-schemas";
import type { ReportType } from "@/pages/reports";

interface DataGridProps {
  data: any[];
  isLoading?: boolean;
  total?: number;
  domain?: string;
  reportType?: ReportType;
}

function formatCellValue(value: any, column: DomainColumn): React.ReactNode {
  if (value === null || value === undefined) return "-";
  
  switch (column.type) {
    case "currency":
      return `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    case "number":
      return Number(value).toLocaleString();
    
    case "date":
      const dateStr = typeof value === 'string' ? value : new Date(value).toISOString();
      return (
        <>
          {dateStr.split('T')[0]} 
          <span className="text-[10px] opacity-50 ml-1">
            {dateStr.split('T')[1]?.split('.')[0] || ''}
          </span>
        </>
      );
    
    case "status":
      const statusColors: Record<string, string> = {
        CLEARED: "bg-emerald-500",
        COMPLETED: "bg-emerald-500",
        APPROVED: "bg-emerald-500",
        POSTED: "bg-emerald-500",
        DELIVERED: "bg-emerald-500",
        NORMAL: "bg-emerald-500",
        ALLOWED: "bg-emerald-500",
        ACTIVE: "bg-emerald-500",
        FILED: "bg-emerald-500",
        SUBMITTED: "bg-emerald-500",
        GRADED: "bg-emerald-500",
        SETTLED: "bg-emerald-500",
        
        PENDING: "bg-amber-500",
        IN_TRANSIT: "bg-amber-500",
        WARNING: "bg-amber-500",
        OPTIMIZING: "bg-amber-500",
        PAUSED: "bg-amber-500",
        PARTIAL: "bg-amber-500",
        HIGH: "bg-amber-500",
        LATE: "bg-amber-500",
        
        FAILED: "bg-rose-500",
        DENIED: "bg-rose-500",
        BLOCKED: "bg-rose-500",
        CRITICAL: "bg-rose-500",
        DROPPED: "bg-rose-500",
        DELINQUENT: "bg-rose-500",
        DELAYED: "bg-rose-500",
        MISSING: "bg-rose-500",
        TAMPERED: "bg-rose-500",
        LAPSED: "bg-rose-500",
        RETURNED: "bg-rose-500",
        
        REFUNDED: "bg-blue-500",
        REVERSED: "bg-blue-500",
        FLAGGED: "bg-purple-500",
        ALERT: "bg-orange-500",
        ROAMING: "bg-cyan-500",
        EXEMPT: "bg-gray-500",
        OFFLINE: "bg-gray-500",
        LOW: "bg-blue-500",
        CLAIMED: "bg-cyan-500",
      };
      
      return (
        <>
          <span className={cn(
            "inline-block w-2 h-2 rounded-full mr-2",
            statusColors[String(value)] || "bg-gray-400"
          )} />
          <span className="text-xs opacity-80">{value}</span>
        </>
      );
    
    case "badge":
      return (
        <Badge variant="outline" className="text-[10px] h-5 font-normal bg-primary/5 border-primary/20 text-primary">
          {value}
        </Badge>
      );
    
    default:
      return String(value);
  }
}

function getCellAlignment(column: DomainColumn): string {
  if (column.type === "currency" || column.type === "number") return "text-right";
  if (column.type === "status") return "text-center";
  return "";
}

function getExceptionReason(status: string): string {
  const reasons: Record<string, string> = {
    FAILED: "Transaction processing failed",
    DENIED: "Request was denied by system",
    BLOCKED: "Transaction blocked by security",
    CRITICAL: "Critical system error detected",
    DROPPED: "Connection dropped during processing",
    DELINQUENT: "Account is past due",
    DELAYED: "Processing delayed beyond threshold",
    MISSING: "Required data not found",
    TAMPERED: "Data integrity check failed",
    LAPSED: "Policy or coverage has lapsed",
    RETURNED: "Item or payment returned",
    FLAGGED: "Flagged for manual review",
    ALERT: "Security alert triggered",
  };
  return reasons[status] || "Unknown exception";
}

export function DataGrid({ data, isLoading, total = 0, domain = "ecommerce", reportType = "detail" }: DataGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const domainSchema = getDomainSchema(domain);
  const baseColumns = getDomainColumns(domain);
  
  // Transform data based on report type
  const { displayData, columns, groupedView, reportLabel } = useMemo(() => {
    switch (reportType) {
      case "summary": {
        // Aggregate by region
        const regionMap = new Map<string, { count: number; totalAmount: number; statuses: Record<string, number> }>();
        data.forEach(row => {
          const region = row.region || "Unknown";
          const existing = regionMap.get(region) || { count: 0, totalAmount: 0, statuses: {} };
          existing.count++;
          existing.totalAmount += Number(row.amount) || 0;
          existing.statuses[row.status] = (existing.statuses[row.status] || 0) + 1;
          regionMap.set(region, existing);
        });
        
        const summaryData = Array.from(regionMap.entries()).map(([region, stats]) => ({
          region,
          transactionCount: stats.count,
          totalAmount: stats.totalAmount,
          avgAmount: stats.totalAmount / stats.count,
          topStatus: Object.entries(stats.statuses).sort((a, b) => b[1] - a[1])[0]?.[0] || "-",
        }));
        
        const summaryColumns: DomainColumn[] = [
          { key: "region", label: "Region", type: "text", width: 150 },
          { key: "transactionCount", label: "Transaction Count", type: "number", width: 140 },
          { key: "totalAmount", label: "Total Amount (₱)", type: "currency", width: 150 },
          { key: "avgAmount", label: "Avg Amount (₱)", type: "currency", width: 130 },
          { key: "topStatus", label: "Most Common Status", type: "status", width: 150 },
        ];
        
        return { displayData: summaryData, columns: summaryColumns, groupedView: false, reportLabel: "Regional Summary" };
      }
      
      case "exception": {
        // Filter for failed/flagged/exception statuses
        const exceptionStatuses = ["FAILED", "DENIED", "BLOCKED", "CRITICAL", "DROPPED", "DELINQUENT", "DELAYED", "MISSING", "TAMPERED", "LAPSED", "RETURNED", "FLAGGED", "ALERT"];
        const exceptionData = data.filter(row => exceptionStatuses.includes(row.status));
        
        const exceptionColumns: DomainColumn[] = [
          { key: "transactionId", label: "Transaction ID", type: "text", width: 140 },
          { key: "timestamp", label: "Timestamp", type: "date", width: 160 },
          { key: "region", label: "Region", type: "text", width: 100 },
          { key: "status", label: "Exception Type", type: "status", width: 120 },
          { key: "amount", label: "Amount (₱)", type: "currency", width: 120 },
          { key: "customer", label: domainSchema.entityLabel, type: "text", width: 130 },
          { key: "errorReason", label: "Reason", type: "text", width: 200 },
        ];
        
        // Add error reason field to data
        const enrichedData = exceptionData.map(row => ({
          ...row,
          errorReason: getExceptionReason(row.status),
        }));
        
        return { displayData: enrichedData, columns: exceptionColumns, groupedView: false, reportLabel: "Exception Report" };
      }
      
      case "booklet": {
        // Group by customer
        const customerMap = new Map<string, any[]>();
        data.forEach(row => {
          const customer = row.customer || "Unknown";
          if (!customerMap.has(customer)) {
            customerMap.set(customer, []);
          }
          customerMap.get(customer)!.push(row);
        });
        
        // Create grouped data with customer headers and subtotals
        const bookletData: any[] = [];
        customerMap.forEach((transactions, customer) => {
          const subtotal = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
          bookletData.push({
            isHeader: true,
            customer,
            transactionCount: transactions.length,
            subtotal,
          });
          transactions.forEach(t => {
            bookletData.push({ ...t, isHeader: false });
          });
        });
        
        return { displayData: bookletData, columns: baseColumns, groupedView: true, reportLabel: `Per-${domainSchema.entityLabel} Statement` };
      }
      
      default:
        return { displayData: data, columns: baseColumns, groupedView: false, reportLabel: "Detailed Transaction Ledger" };
    }
  }, [data, reportType, domain, baseColumns, domainSchema]);

  const rowVirtualizer = useVirtualizer({
    count: displayData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => groupedView && displayData[index]?.isHeader ? 56 : 45,
    overscan: 5,
  });

  if (isLoading) {
    return (
      <div className="h-[500px] w-full flex items-center justify-center border rounded-md bg-background/50" data-testid="loading-spinner">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm">Loading massive dataset...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[200px] w-full flex items-center justify-center border rounded-md bg-background/50 text-muted-foreground border-dashed" data-testid="empty-state">
        No data loaded. Run a preview first.
      </div>
    );
  }

  // Handle case where transformed data is empty (e.g., no exceptions found)
  if (displayData.length === 0 && data.length > 0) {
    return (
      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden" data-testid="data-grid">
        <div className="p-3 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">
              {reportType.toUpperCase()}
            </Badge>
            <span className="text-sm font-medium text-foreground">{reportLabel}</span>
          </div>
        </div>
        <div className="h-[200px] w-full flex items-center justify-center text-muted-foreground" data-testid="empty-filtered-state">
          {reportType === "exception" 
            ? "No exceptions found in the selected data range." 
            : "No data matches the current report criteria."}
        </div>
        <div className="p-2 bg-muted/50 border-t border-border text-xs text-muted-foreground flex justify-between items-center">
          <span>No matching records</span>
          <span data-testid="text-total-rows">Total in Database: {total.toLocaleString()} rows</span>
        </div>
      </div>
    );
  }

  const gridTemplateColumns = columns.map(col => col.width ? `${col.width}px` : '1fr').join(' ');

  return (
    <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden" data-testid="data-grid">
      <div className="p-3 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30 text-primary">
            {reportType.toUpperCase()}
          </Badge>
          <span className="text-sm font-medium text-foreground">{reportLabel}</span>
        </div>
        {reportType === "exception" && (
          <span className="text-xs text-muted-foreground">
            {displayData.length} exceptions found
          </span>
        )}
        {reportType === "summary" && (
          <span className="text-xs text-muted-foreground">
            {displayData.length} regions
          </span>
        )}
      </div>
      <div 
        className="p-4 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider overflow-x-auto"
        style={{ display: 'grid', gridTemplateColumns, gap: '0.5rem', minWidth: 'max-content' }}
      >
        {columns.map((col) => (
          <div key={col.key} className={getCellAlignment(col)}>
            {col.label}
          </div>
        ))}
      </div>
      <div
        ref={parentRef}
        className="h-[500px] overflow-auto w-full custom-scrollbar"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
            minWidth: 'max-content',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = displayData[virtualRow.index];
            
            // Render customer header row for booklet view
            if (groupedView && item.isHeader) {
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  data-testid={`row-header-${virtualRow.index}`}
                  ref={rowVirtualizer.measureElement}
                  className="absolute top-0 left-0 w-full p-3 border-b-2 border-primary/30 bg-primary/10 text-sm font-semibold"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                    minWidth: 'max-content',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-primary">
                      {domainSchema.entityLabel}: {item.customer}
                    </span>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{item.transactionCount} transactions</span>
                      <span className="font-bold text-foreground">
                        Subtotal: ₱{item.subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                data-testid={`row-data-${virtualRow.index}`}
                ref={rowVirtualizer.measureElement}
                className={cn(
                  "absolute top-0 left-0 w-full p-3 border-b border-border/50 hover:bg-white/5 transition-colors text-sm font-mono",
                  virtualRow.index % 2 === 0 ? "bg-background/30" : "bg-transparent",
                  groupedView && "pl-6" // Indent rows in booklet view
                )}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'grid',
                  gridTemplateColumns,
                  gap: '0.5rem',
                  minWidth: 'max-content',
                }}
              >
                {columns.map((col) => {
                  const value = item[col.key] ?? item.transactionId ?? item.id;
                  return (
                    <div 
                      key={col.key} 
                      className={cn(
                        "truncate",
                        getCellAlignment(col),
                        col.type === "currency" && "tabular-nums font-bold",
                        col.key === "transactionId" || col.key === "recordId" ? "text-primary/80" : ""
                      )}
                    >
                      {formatCellValue(col.key === "transactionId" && !item[col.key] ? item.id : value, col)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-2 bg-muted/50 border-t border-border text-xs text-muted-foreground flex justify-between items-center">
        <span data-testid="text-row-count">
          Showing {displayData.length.toLocaleString()} {reportType === "summary" ? "regions" : reportType === "booklet" ? "entries" : "rows"} (Preview)
        </span>
        <span data-testid="text-total-rows">Total in Database: {total.toLocaleString()} rows</span>
      </div>
    </div>
  );
}
