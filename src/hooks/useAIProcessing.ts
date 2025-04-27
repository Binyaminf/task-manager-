
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AIAnalysis {
  confidence: number;
  relatedKeywords: string[];
}

interface ProcessingState {
  step: 'idle' | 'analyzing' | 'creating' | 'complete';
  error: string | null;
}

export function useAIProcessing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    step: 'idle',
    error: null,
  });
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const { toast } = useToast();

  const processAIRequest = async (input: string) => {
    if (!input.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingState({ step: 'analyzing', error: null });

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const currentTime = new Date().toISOString();
      console.log('Sending request to Edge Function with text:', input.trim());
      
      setProcessingState({ step: 'creating', error: null });
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
        setAnalysis(data.analysis);
        setProcessingState({ step: 'complete', error: null });
        
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
        
        return true;
      }
    } catch (error) {
      console.error('Error processing AI request:', error);
      setProcessingState({ 
        step: 'idle', 
        error: error.message || "Failed to process your request" 
      });
      toast({
        title: "Error",
        description: error.message || "Failed to process your request. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    processingState,
    analysis,
    processAIRequest,
  };
}
