import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

      const currentTime = new Date().toISOString();
      console.log('Sending request to Edge Function with text:', input.trim());
      console.log('Current time reference:', currentTime);
      
      const { data, error } = await supabase.functions.invoke('process-task-text', {
        body: { 
          text: input.trim(),
          currentTime: currentTime
        }
      });

      if (error) {
        console.error('Error from Edge Function:', error);
        throw error;
      }

      console.log('Edge Function response:', data);

      if (!data) {
        throw new Error('No data received from Edge Function');
      }

      if (data.type === 'search') {
        toast({
          title: "Search Results",
          description: `Found ${data.results.length} matching tasks`,
        });
      } else if (data.type === 'create') {
        const { error: createError } = await supabase
          .from('tasks')
          .insert([{
            user_id: session.session.user.id,
            summary: data.task.summary,
            description: data.task.description,
            due_date: data.task.dueDate,
            estimated_duration: data.task.estimatedDuration,
            priority: data.task.priority,
            status: "To Do",
            category: data.task.category
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
        description: error.message || "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 mb-8">
      <Textarea
        placeholder="Enter your task naturally... Examples:
• Create a high priority task to review the project proposal by next Friday
• Schedule a meeting with the team tomorrow that will take 2 hours
• Research new technologies for the next sprint in 3 days
• Document the API changes by next week"
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