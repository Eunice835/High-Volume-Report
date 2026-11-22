import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";

const chartData = [
  { name: "Jan", total: 120000, processed: 118000 },
  { name: "Feb", total: 145000, processed: 130000 },
  { name: "Mar", total: 160000, processed: 155000 },
  { name: "Apr", total: 110000, processed: 110000 },
  { name: "May", total: 195000, processed: 190000 },
  { name: "Jun", total: 180000, processed: 175000 },
];

export function DashboardStats() {
  const { data: statsData } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    refetchInterval: 5000,
  });

  const stats = statsData || {
    octaneWorkers: { active: 24, total: 24 },
    queueDepth: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card className="glass-panel md:col-span-2" data-testid="card-throughput">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Throughput Volume (Rows Processed)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                />
                <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value / 1000}k`} 
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                />
                <Line 
                    type="monotone" 
                    dataKey="processed" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        <Card className="glass-panel bg-primary/5 border-primary/20" data-testid="card-workers">
            <CardContent className="p-6">
                <div className="text-sm font-medium text-primary/80 mb-2">Active Workers</div>
                <div className="text-4xl font-bold text-primary font-mono" data-testid="text-worker-count">{stats.octaneWorkers?.active || 24}</div>
                <div className="text-xs text-muted-foreground mt-2">Octane (Swoole) Process Group</div>
            </CardContent>
        </Card>
        <Card className="glass-panel" data-testid="card-queue">
            <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-2">Queue Depth</div>
                <div className="text-4xl font-bold text-foreground font-mono" data-testid="text-queue-depth">{stats.queueDepth || 0}</div>
                <div className="text-xs text-emerald-500 mt-2 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Processing Normally
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
