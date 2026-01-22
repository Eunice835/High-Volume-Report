import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function SchedulerDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Monthly Financial Rollup");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [recipients, setRecipients] = useState("");
  const [format, setFormat] = useState<"pdf" | "xlsx">("pdf");
  const queryClient = useQueryClient();

  const createScheduleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/schedules", {
        name,
        frequency,
        recipients: recipients.split(",").map(e => e.trim()).filter(Boolean),
        format,
        reportType: "detail",
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Schedule Created",
        description: `Report "${name}" will run ${frequency} starting tomorrow.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setOpen(false);
      setName("Monthly Financial Rollup");
      setRecipients("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSchedule = () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Please enter a job name.", variant: "destructive" });
      return;
    }
    if (!recipients.trim()) {
      toast({ title: "Error", description: "Please enter at least one recipient email.", variant: "destructive" });
      return;
    }
    createScheduleMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-32 gap-2" data-testid="button-schedule">
          <Clock className="h-4 w-4" />
          Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-panel bg-card/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle>Schedule Recurring Export</DialogTitle>
          <DialogDescription>
            Set up an automated job to run this report periodically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Job Name
            </Label>
            <Input 
              id="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3" 
              data-testid="input-schedule-name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="frequency" className="text-right">
              Frequency
            </Label>
            <Select onValueChange={(v) => setFrequency(v as any)} defaultValue="daily">
                <SelectTrigger className="col-span-3" data-testid="select-frequency">
                    <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="daily">Daily (00:00 UTC)</SelectItem>
                    <SelectItem value="weekly">Weekly (Mondays)</SelectItem>
                    <SelectItem value="monthly">Monthly (1st day)</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <Select onValueChange={(v) => setFormat(v as any)} defaultValue="pdf">
                <SelectTrigger className="col-span-3" data-testid="select-format">
                    <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Recipients
            </Label>
            <Input 
              id="email" 
              placeholder="finance@nexus.com, cfo@nexus.com" 
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="col-span-3" 
              data-testid="input-recipients"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleSchedule}
            disabled={createScheduleMutation.isPending}
            data-testid="button-create-schedule"
          >
            {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
