import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Activity, AlertTriangle, CheckCircle, Server, ShieldAlert, Users, Clock, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function AdminDashboard() {
  const [workerCount, setWorkerCount] = useState(24);
  const [memoryPerWorker, setMemoryPerWorker] = useState(512);
  const [queueStrategy, setQueueStrategy] = useState("fifo");
  const queryClient = useQueryClient();
  
  const purgeJobsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/admin/failed-jobs", {});
      if (!response.ok) throw new Error("Failed to purge jobs");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Jobs Purged",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/exports"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to purge failed jobs.",
        variant: "destructive",
      });
    },
  });
  
  const recoverJobsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/recover-stuck-jobs", {});
      if (!response.ok) throw new Error("Failed to recover jobs");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Recovery Complete",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/exports"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to recover stuck jobs.",
        variant: "destructive",
      });
    },
  });
  
  const handleRecoverJobs = () => {
    recoverJobsMutation.mutate();
  };
  
  const createStuckJobMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/create-stuck-job", {});
      if (!response.ok) throw new Error("Failed to create stuck job");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test Job Created",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/exports"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create stuck job.",
        variant: "destructive",
      });
    },
  });
  
  const handleCreateStuckJob = () => {
    createStuckJobMutation.mutate();
  };
  
  const handlePurgeJobs = () => {
    purgeJobsMutation.mutate();
  };

  const handleSaveWorkerConfig = () => {
    toast({
      title: "Configuration Saved",
      description: `Workers: ${workerCount}, Memory: ${memoryPerWorker}MB, Strategy: ${queueStrategy.toUpperCase()}`,
    });
  };

  const { data: statsData } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    refetchInterval: 5000,
  });

  const { data: jobsData, refetch: refetchJobs } = useQuery({
    queryKey: ["/api/reports/exports"],
    queryFn: async () => {
      const response = await fetch("/api/reports/exports");
      if (!response.ok) throw new Error("Failed to fetch jobs");
      return response.json();
    },
    refetchInterval: 3000,
  });

  const { data: schedulesData } = useQuery({
    queryKey: ["/api/schedules"],
    queryFn: async () => {
      const response = await fetch("/api/schedules");
      if (!response.ok) throw new Error("Failed to fetch schedules");
      return response.json();
    },
  });

  const stats = statsData || { octaneWorkers: { active: 24, total: 24 }, queueDepth: 0, deadLetterQueue: 0, activeUsers: 0 };
  const jobs = jobsData?.jobs || [];
  const schedules = schedulesData?.schedules || [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">System Administration</h1>
                <p className="text-muted-foreground">Monitor system health, worker queues, and global job status.</p>
            </div>
            <div className="flex gap-2">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2" data-testid="button-purge">
                            <ShieldAlert className="h-4 w-4" />
                            Purge Failed Jobs
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Purge Failed Jobs</DialogTitle>
                            <DialogDescription>
                                This will permanently delete all failed jobs from the queue. This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                <div className="text-sm">
                                    <p className="font-medium">Warning</p>
                                    <p className="text-muted-foreground">
                                        {stats.deadLetterQueue > 0 
                                          ? `${stats.deadLetterQueue} failed job(s) will be permanently removed.`
                                          : "No failed jobs to purge."}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button 
                                    variant="destructive" 
                                    onClick={handlePurgeJobs}
                                    disabled={stats.deadLetterQueue === 0 || purgeJobsMutation.isPending}
                                >
                                    {purgeJobsMutation.isPending ? "Purging..." : "Purge Jobs"}
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2" 
                    data-testid="button-recover-stuck"
                    onClick={handleRecoverJobs}
                    disabled={recoverJobsMutation.isPending}
                >
                    <RefreshCw className={`h-4 w-4 ${recoverJobsMutation.isPending ? "animate-spin" : ""}`} />
                    {recoverJobsMutation.isPending ? "Recovering..." : "Recover Stuck Jobs"}
                </Button>
                
                <Button 
                    variant="secondary" 
                    size="sm" 
                    className="gap-2" 
                    data-testid="button-create-stuck"
                    onClick={handleCreateStuckJob}
                    disabled={createStuckJobMutation.isPending}
                >
                    <AlertTriangle className="h-4 w-4" />
                    {createStuckJobMutation.isPending ? "Creating..." : "Stuck Job"}
                </Button>
                
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2" data-testid="button-worker-config">
                            <Server className="h-4 w-4" />
                            Worker Config
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Worker Configuration</DialogTitle>
                            <DialogDescription>
                                Configure the number of background workers for processing export jobs.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="workers">Number of Workers</Label>
                                <Input 
                                    id="workers" 
                                    type="number" 
                                    value={workerCount} 
                                    onChange={(e) => setWorkerCount(parseInt(e.target.value) || 1)}
                                    min={1}
                                    max={64}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Recommended: 24 workers for optimal performance. Max: 64.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="memory">Memory per Worker (MB)</Label>
                                <Input 
                                    id="memory"
                                    type="number"
                                    value={memoryPerWorker}
                                    onChange={(e) => setMemoryPerWorker(parseInt(e.target.value) || 256)}
                                    min={256}
                                    max={4096}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Min: 256 MB, Max: 4096 MB (4 GB)
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="strategy">Queue Strategy</Label>
                                <Select value={queueStrategy} onValueChange={setQueueStrategy}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fifo">FIFO (First In, First Out)</SelectItem>
                                        <SelectItem value="lifo">LIFO (Last In, First Out)</SelectItem>
                                        <SelectItem value="priority">Priority-based</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    FIFO is recommended for fair job processing.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button onClick={handleSaveWorkerConfig}>Save Configuration</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-panel border-l-4 border-l-emerald-500" data-testid="card-latency">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-muted-foreground">API Latency (p95)</div>
                        <div className="text-2xl font-bold" data-testid="text-latency">{stats.apiLatency || "124ms"}</div>
                    </div>
                </CardContent>
            </Card>
            <Card className="glass-panel border-l-4 border-l-primary" data-testid="card-workers">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Server className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-muted-foreground">Octane Workers</div>
                        <div className="text-2xl font-bold" data-testid="text-workers">{stats.octaneWorkers?.active || 24} / {stats.octaneWorkers?.total || 24}</div>
                    </div>
                </CardContent>
            </Card>
            <Card className="glass-panel border-l-4 border-l-amber-500" data-testid="card-dlq">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-muted-foreground">Dead Letter Queue</div>
                        <div className="text-2xl font-bold" data-testid="text-dlq">{stats.deadLetterQueue || 0}</div>
                    </div>
                </CardContent>
            </Card>
             <Card className="glass-panel border-l-4 border-l-blue-500" data-testid="card-users">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-muted-foreground">Active Users</div>
                        <div className="text-2xl font-bold" data-testid="text-users">{stats.activeUsers || 0}</div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Global Job Monitor */}
            <Card className="glass-panel lg:col-span-2" data-testid="card-job-monitor">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Global Job Monitor</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => refetchJobs()} data-testid="button-refresh-jobs">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto">
                    {jobs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground" data-testid="empty-jobs">
                            No jobs yet. Create a report export to see jobs here.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Job ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Progress</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.map((job: any) => (
                                    <TableRow key={job.jobId} data-testid={`row-job-${job.jobId}`}>
                                        <TableCell className="font-mono text-xs">{job.jobId}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{job.name}</TableCell>
                                        <TableCell className="text-xs">
                                            <Badge variant="outline" className="text-[10px]">{job.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={job.status === 'completed' ? 'default' : job.status === 'processing' ? 'secondary' : 'outline'} className={
                                                job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                                job.status === 'failed' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                job.status === 'queued' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                'bg-primary/10 text-primary border-primary/20'
                                            }>
                                                {job.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="w-[150px]">
                                            <Progress value={job.progress} className="h-2" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Scheduled Tasks */}
            <Card className="glass-panel" data-testid="card-schedules">
                <CardHeader>
                    <CardTitle>Active Schedules</CardTitle>
                </CardHeader>
                <CardContent>
                    {schedules.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground" data-testid="empty-schedules">
                            No scheduled reports yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {schedules.map((schedule: any) => (
                                <div key={schedule.scheduleId} className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                                    <div>
                                        <div className="font-medium text-sm">{schedule.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {schedule.frequency} • Next: {schedule.nextRun?.split('T')[0]}
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-500 border-emerald-500/20">
                                        Active
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </Layout>
  );
}
