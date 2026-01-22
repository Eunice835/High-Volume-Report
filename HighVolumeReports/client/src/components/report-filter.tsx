import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, Download, FileText, Table, Building2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REGIONS } from "@/lib/mock-data";

export const INDUSTRY_DOMAINS = [
  { id: "telecom", name: "Telecom CDRs", description: "Call logs, SMS, data sessions" },
  { id: "ecommerce", name: "E-commerce Ledger", description: "Orders, refunds, shipments" },
  { id: "banking", name: "Banking/FinTech", description: "Ledger movements, reconciliations" },
  { id: "government", name: "Government Census", description: "Barangay rollups, tax filings" },
  { id: "healthcare", name: "Healthcare Claims", description: "Claims, diagnosis codes" },
  { id: "education", name: "Education LMS", description: "Course events, submissions" },
  { id: "logistics", name: "Transportation/Logistics", description: "GPS pings, waybills, deliveries" },
  { id: "manufacturing", name: "Manufacturing/IoT", description: "Sensor readings, QC inspections" },
  { id: "cybersecurity", name: "Cybersecurity/SIEM", description: "Auth events, firewall logs" },
  { id: "energy", name: "Energy/Utilities", description: "Smart meter readings" },
  { id: "insurance", name: "Insurance Policies", description: "Claims, reserves, payouts" },
  { id: "adtech", name: "AdTech/Analytics", description: "Impressions, clicks, conversions" },
] as const;

export type IndustryDomain = typeof INDUSTRY_DOMAINS[number]["id"];

const formSchema = z.object({
  domain: z.string(),
  reportType: z.string(),
  dateRange: z.object({
    from: z.date(),
    to: z.date().optional(),
  }),
  regions: z.array(z.string()).refine((value) => value.length > 0, {
    message: "You have to select at least one region.",
  }),
  format: z.enum(["pdf", "xlsx"]),
});

import { SchedulerDialog } from "@/components/scheduler-dialog";

export function ReportFilter({ onPreview, onExport }: { onPreview: (data: any) => void, onExport: (data: any) => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: "ecommerce",
      reportType: "detail",
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        to: new Date(),
      },
      regions: [],
      format: "pdf",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>, action: "preview" | "export") {
    if (action === "preview") {
        onPreview(values);
    } else {
        onExport(values);
    }
  }

  return (
    <Card className="glass-panel border-none shadow-2xl mb-6">
      <CardHeader className="pb-4 border-b border-border/50">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Report Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form className="space-y-6">
            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Industry Domain
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-domain">
                        <SelectValue placeholder="Select industry domain" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {INDUSTRY_DOMAINS.map((domain) => (
                        <SelectItem key={domain.id} value={domain.id} data-testid={`domain-${domain.id}`}>
                          <div className="flex flex-col">
                            <span className="font-medium">{domain.name}</span>
                            <span className="text-xs text-muted-foreground">{domain.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose your industry to see domain-specific data columns and reports.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FormField
                control={form.control}
                name="reportType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="detail">Detailed Transaction Ledger</SelectItem>
                        <SelectItem value="summary">Regional Summary</SelectItem>
                        <SelectItem value="exception">Exception / Fraud Report</SelectItem>
                        <SelectItem value="booklet">Per-Customer Statement (Booklet)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Determines the structure and aggregation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date Range</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value?.from ? (
                              field.value.to ? (
                                <>
                                  {format(field.value.from, "LLL dd, y")} -{" "}
                                  {format(field.value.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(field.value.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={field.value}
                          onSelect={field.onChange}
                          numberOfMonths={2}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                        Select period for data inclusion.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="regions"
                render={() => (
                  <FormItem>
                    <FormLabel className="mb-4 block">Regions</FormLabel>
                    <div className="grid grid-cols-2 gap-2 border border-input rounded-md p-3 h-[100px] overflow-y-auto bg-background/50">
                      {REGIONS.map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="regions"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-xs cursor-pointer">
                                  {item}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                    <FormItem>
                      <FormLabel>Export Format</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pdf">PDF Document (Paged)</SelectItem>
                          <SelectItem value="xlsx">Microsoft Excel (.xlsx)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                         PDFs support 1000+ pages with TOC.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
              <div className="mr-auto">
                <SchedulerDialog />
              </div>
              <Button 
                type="button" 
                variant="secondary" 
                className="w-32"
                onClick={form.handleSubmit((v) => onSubmit(v, "preview"))}
              >
                <Table className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button 
                type="button" 
                className="w-40"
                onClick={form.handleSubmit((v) => onSubmit(v, "export"))}
              >
                <Download className="mr-2 h-4 w-4" />
                Queue Export
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
