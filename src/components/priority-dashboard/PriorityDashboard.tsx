
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { addDays, isPast, parseISO } from "date-fns";
import { PriorityTask } from "./PriorityTask";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Bell, Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";

export function PriorityDashboard() {
  const { toast } = useToast();
  const [aiSummary, setAiSummary] = useState<string>("");
  const [summaryModel, setSummaryModel] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Error",
          description: "Failed to load priority tasks",
          variant: "destructive",
        });
        return [];
      }

      return data.map((task): Task => ({
        id: task.id,
        summary: task.summary,
        description: task.description || undefined,
        dueDate: task.due_date,
        estimatedDuration: task.estimated_duration,
        priority: task.priority as Task["priority"],
        status: task.status as Task["status"],
        category: task.category,
        externalLinks: task.external_links || undefined,
        folder_id: task.folder_id
      }));
    },
  });

  // Filter and sort priority tasks
  const priorityTasks = tasks
    .filter(task => {
      if (task.status === "Done") return false;
      const dueDate = parseISO(task.dueDate);
      const isWithin72Hours = dueDate <= addDays(new Date(), 3);
      const isOverdue = isPast(dueDate);
      return isOverdue || isWithin72Hours;
    })
    .sort((a, b) => {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);

  const generateAISummary = async () => {
    setIsLoadingSummary(true);
    setSummaryError(null);
    
    try {
      const response = await supabase.functions.invoke('summarize-tasks', {
        body: { tasks: priorityTasks }
      });

      if (response.error) throw new Error(response.error.message);
      
      setAiSummary(response.data.summary);
      setSummaryModel(response.data.model || "AI");
      
      toast({
        title: "Success",
        description: "AI summary generated successfully",
      });
    } catch (error: any) {
      console.error('Error generating AI summary:', error);
      setSummaryError(error.message || "Failed to generate summary");
      toast({
        title: "Error",
        description: "Failed to generate AI summary",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  if (priorityTasks.length === 0) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary animate-pulse" />
            <CardTitle className="text-base">Priority Tasks ({priorityTasks.length})</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateAISummary}
            disabled={isLoadingSummary || priorityTasks.length === 0}
            className="h-8 px-2 text-sm"
          >
            {isLoadingSummary ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            {isLoadingSummary ? "Generating..." : "AI Summary"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-2 space-y-2">
        {summaryError && (
          <Alert variant="destructive" className="mb-3 py-2">
            <AlertDescription className="text-xs">{summaryError}</AlertDescription>
          </Alert>
        )}
        
        {aiSummary && !summaryError && (
          <div className="bg-muted/50 p-3 rounded-md text-sm mb-3">
            <p className="whitespace-pre-line text-xs">{aiSummary}</p>
            {summaryModel && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Generated using {summaryModel}
              </p>
            )}
          </div>
        )}
        
        {priorityTasks.map((task) => (
          <PriorityTask key={task.id} task={task} />
        ))}
      </CardContent>
    </Card>
  );
}
