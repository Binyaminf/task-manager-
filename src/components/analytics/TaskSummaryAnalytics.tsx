
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@/types/task";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, PieChart, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function TaskSummaryAnalytics() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryModel, setSummaryModel] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks-for-analytics'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*');
      
      if (error) {
        console.error('Error fetching tasks for analytics:', error);
        throw error;
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

  const generateAnalytics = async () => {
    if (tasks.length === 0) {
      toast({
        title: "No tasks available",
        description: "Add some tasks to generate analytics",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setSummary(null);
    
    try {
      const response = await supabase.functions.invoke('summarize-tasks', {
        body: { tasks }
      });
      
      if (response.error) throw new Error(response.error.message);
      
      setSummary(response.data.summary);
      setSummaryModel(response.data.model || "AI");
      
      toast({
        title: "Success",
        description: "Task analytics generated successfully",
      });
    } catch (error: any) {
      console.error('Error generating task analytics:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate analytics",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderSummaryContent = () => {
    if (summary) {
      // Process and format the summary text with proper line breaks and styling
      const sections = summary.split('\n\n').filter(Boolean);
      
      return (
        <div className="space-y-4">
          {sections.map((section, index) => {
            // Check if it's a section header (with emoji)
            if (section.includes('*') && section.includes('📋')) {
              return (
                <h3 key={index} className="text-lg font-semibold">
                  {section.replace(/\*/g, '')}
                </h3>
              );
            }
            
            // Check if it's a subheading
            if (section.includes('*')) {
              return (
                <h4 key={index} className="text-md font-medium text-primary mt-3">
                  {section.replace(/\*/g, '')}
                </h4>
              );
            }
            
            // Render normal paragraph with bullet points
            return (
              <div key={index} className="text-sm">
                {section.split('\n').map((line, lineIndex) => {
                  if (line.startsWith('•') || line.startsWith('⚠️') || 
                      line.startsWith('🔴') || line.startsWith('🟠') || 
                      line.startsWith('🟢') || line.startsWith('⏱') || 
                      line.startsWith('⏰') || line.startsWith('📆') || 
                      line.startsWith('🗓') || line.startsWith('📚') || 
                      line.startsWith('🔍') || line.startsWith('🔥')) {
                    return (
                      <div key={lineIndex} className="flex items-start gap-2 py-0.5">
                        <span className="inline-block w-5">{line.charAt(0)}</span>
                        <span>{line.substring(2)}</span>
                      </div>
                    );
                  }
                  return <p key={lineIndex} className="py-0.5">{line}</p>;
                })}
              </div>
            );
          })}
          
          {summaryModel && (
            <p className="text-xs text-muted-foreground mt-4">
              Analysis generated using {summaryModel}
            </p>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Task Analytics</CardTitle>
          <CardDescription>
            Get insights into your task management patterns
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={generateAnalytics}
          disabled={isGenerating || isLoading || tasks.length === 0}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <PieChart className="h-4 w-4" />
              Generate Analytics
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">No Tasks Available</h3>
            <p className="text-sm text-muted-foreground">
              Create some tasks to generate analytics and insights
            </p>
          </div>
        ) : !summary ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">Generate Your Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Click the button above to analyze {tasks.length} tasks and get insights
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <Badge variant="outline">{tasks.filter(t => t.status === 'To Do').length} to do</Badge>
              <Badge variant="outline">{tasks.filter(t => t.status === 'In Progress').length} in progress</Badge>
              <Badge variant="outline">{tasks.filter(t => t.status === 'Done').length} done</Badge>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 p-4 rounded-md">
            {renderSummaryContent()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
