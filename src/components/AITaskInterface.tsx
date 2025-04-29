
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, AlertTriangle } from "lucide-react";
import { ProcessingSteps } from "./ai/ProcessingSteps";
import { AIAnalysisDisplay } from "./ai/AIAnalysisDisplay";
import { useAIProcessing } from "@/hooks/useAIProcessing";
import { useToast } from "@/hooks/use-toast";

interface AITaskInterfaceProps {
  onTaskCreated: () => void;
}

export function AITaskInterface({ onTaskCreated }: AITaskInterfaceProps) {
  const [input, setInput] = useState("");
  const [draftTimeout, setDraftTimeout] = useState<number | null>(null);
  const {
    isProcessing,
    processingState,
    analysis,
    processAIRequest,
    retryLastRequest
  } = useAIProcessing();
  const { toast } = useToast();

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('taskDraft');
    if (savedDraft) {
      setInput(savedDraft);
    }
  }, []);

  // Save draft to localStorage with debounce
  const saveDraft = (text: string) => {
    if (draftTimeout) {
      window.clearTimeout(draftTimeout);
    }
    const timeout = window.setTimeout(() => {
      localStorage.setItem('taskDraft', text);
    }, 800);
    setDraftTimeout(timeout);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInput(text);
    saveDraft(text);
  };

  const handleSubmit = async () => {
    try {
      const success = await processAIRequest(input);
      if (success) {
        setInput("");
        localStorage.removeItem('taskDraft');
        onTaskCreated();
      }
    } catch (error) {
      console.error('Error in task creation:', error);
      toast({
        title: "Error",
        description: "Something went wrong while creating your task",
        variant: "destructive",
      });
    }
  };

  const handleRetry = async () => {
    try {
      const success = await retryLastRequest();
      if (success) {
        setInput("");
        localStorage.removeItem('taskDraft');
        onTaskCreated();
      }
    } catch (error) {
      console.error('Error in retry attempt:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const examples = [
    "Create a high priority task to review the project proposal by next Friday",
    "Schedule a 2-hour meeting with the team tomorrow to discuss the new features", 
    "Research new technologies for the next sprint, should take about 3 days",
    "Document the API changes by next week, low priority"
  ];

  const handleExampleClick = (example: string) => {
    setInput(example);
    saveDraft(example);
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="relative">
        <Textarea
          placeholder="Enter your task naturally..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="min-h-[100px] pr-32"
          aria-label="Task description"
          disabled={isProcessing}
        />
        {analysis && <AIAnalysisDisplay analysis={analysis} />}
      </div>
      
      <ProcessingSteps 
        step={processingState.step}
        error={processingState.error}
        onRetry={handleRetry}
      />

      {!isProcessing && input.length === 0 && (
        <div className="text-xs text-muted-foreground">
          <p className="mb-2">Try these examples:</p>
          <div className="space-y-1">
            {examples.map((example, index) => (
              <button 
                key={index} 
                onClick={() => handleExampleClick(example)}
                className="text-left hover:text-primary text-xs block w-full truncate"
              >
                • {example}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button 
        onClick={handleSubmit} 
        disabled={isProcessing || input.trim().length === 0}
        className="w-full"
      >
        <Wand2 className="mr-2 h-4 w-4" />
        {isProcessing ? "Processing..." : "Process with AI"}
      </Button>
      
      <p className="text-xs text-muted-foreground text-center">
        Press Cmd/Ctrl + Enter to submit
      </p>
    </div>
  );
}
