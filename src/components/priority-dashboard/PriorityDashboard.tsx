import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "../TaskCard";
import { addDays, isPast, parseISO } from "date-fns";
import { PriorityTask } from "./PriorityTask";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Bell, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "../ui/button";

export function PriorityDashboard() {
  const { toast } = useToast();
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

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
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch('/functions/v1/summarize-tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setAiSummary(data.summary);
      toast({
        title: "Success",
        description: "AI summary generated successfully",
      });
    } catch (error) {
      console.error('Error generating AI summary:', error);
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
    <Card className="mb-8 border-2 border-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary animate-pulse" />
            <CardTitle className="text-xl">Priority Dashboard</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateAISummary}
            disabled={isLoadingSummary}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isLoadingSummary ? "Generating..." : "AI Summary"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {aiSummary && (
          <div className="bg-muted p-4 rounded-lg text-sm">
            <p className="whitespace-pre-line">{aiSummary}</p>
          </div>
        )}
        {priorityTasks.map((task) => (
          <PriorityTask key={task.id} task={task} />
        ))}
      </CardContent>
    </Card>
  );
}