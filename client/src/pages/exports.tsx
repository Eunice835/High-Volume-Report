import { Layout } from "@/components/layout";
import { JobCenter } from "@/components/job-center";

export default function Exports() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col">
        <div className="mb-8 flex-none">
            <h1 className="text-3xl font-bold tracking-tight">Export Center</h1>
            <p className="text-muted-foreground">Monitor background jobs and download generated artifacts.</p>
        </div>
        <div className="flex-1 min-h-0">
             <JobCenter />
        </div>
      </div>
    </Layout>
  );
}
