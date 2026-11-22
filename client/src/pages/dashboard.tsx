import { Layout } from "@/components/layout";
import { DashboardStats } from "@/components/dashboard-stats";
import { JobCenter } from "@/components/job-center";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Real-time system overview and recent activity.</p>
            </div>
            <Link href="/reports">
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <FileText className="h-4 w-4" />
                    New Report
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </Link>
        </div>
        
        <DashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
            <div className="h-full">
                 <h3 className="text-lg font-medium mb-4">Active Job Queue</h3>
                 <JobCenter />
            </div>
            
            <div className="bg-gradient-to-br from-secondary/20 to-primary/5 rounded-xl border border-white/5 p-8 flex flex-col justify-center items-center text-center">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-1 ring-primary/30">
                    <FileText className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Ready for Analysis?</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                    Generate detailed transaction ledgers or executive summaries from the 10M+ row dataset.
                </p>
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                    <Link href="/reports">
                        <Button variant="outline" className="w-full">Detail Report</Button>
                    </Link>
                     <Link href="/reports">
                        <Button variant="outline" className="w-full">Summary</Button>
                    </Link>
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
}
