import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "./TaskCard";

interface AITaskInterfaceProps {
  onTaskCreated: () => void;
}

export function AITaskInterface({ onTaskCreated }: AITaskInterfaceProps) {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processAIRequest = async () => {
    if (!input.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('process-task-text', {
        body: { text: input },
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) {
        console.error('Error from Edge Function:', error);
        throw error;
      }

      console.log('Edge Function response:', data);

      if (data.type === 'search') {
        // Handle search results
        toast({
          title: "Search Results",
          description: `Found ${data.results.length} matching tasks`,
        });
        // You can add additional handling of search results here
      } else if (data.type === 'create') {
        // Create new task
        const { error: createError } = await supabase
          .from('tasks')
          .insert([{
            user_id: session.session.user.id,
            summary: data.task.summary,
            description: data.task.description,
            due_date: data.task.dueDate,
            estimated_duration: data.task.estimatedDuration || "1h",
            priority: data.task.priority || "Medium",
            status: "To Do",
            category: data.task.category || "General"
          }]);

        if (createError) throw createError;

        toast({
          title: "Success",
          description: "Task created successfully",
        });
        
        setInput("");
        onTaskCreated();
      }
    } catch (error) {
      console.error('Error processing AI request:', error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 mb-8">
      <Textarea
        placeholder="Enter your task or search query in natural language... (e.g., 'Create a high priority task for reviewing the project proposal by next Friday' or 'Find all urgent tasks about meetings')"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="min-h-[100px]"
      />
      <Button 
        onClick={processAIRequest} 
        disabled={isProcessing}
        className="w-full"
      >
        <Wand2 className="mr-2 h-4 w-4" />
        {isProcessing ? "Processing..." : "Process with AI"}
      </Button>
    </div>
  );
}