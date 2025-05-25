
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Sparkles, RotateCw } from "lucide-react";
import { EnhancedProcessingSteps } from "./ai/EnhancedProcessingSteps";
import { EnhancedAIAnalysisDisplay } from "./ai/EnhancedAIAnalysisDisplay";
import { useEnhancedAIProcessing } from "@/hooks/useEnhancedAIProcessing";
import { useToast } from "@/hooks/use-toast";

interface EnhancedAITaskInterfaceProps {
  onTaskCreated: () => void;
}

export function EnhancedAITaskInterface({ onTaskCreated }: EnhancedAITaskInterfaceProps) {
  const [input, setInput] = useState("");
  const [draftTimeout, setDraftTimeout] = useState<number | null>(null);
  const {
    isProcessing,
    processingState,
    analysis,
    processAIRequest,
    retryLastRequest,
    clearAnalysis
  } = useEnhancedAIProcessing();
  const { toast } = useToast();

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('enhancedTaskDraft');
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
      localStorage.setItem('enhancedTaskDraft', text);
    }, 800);
    setDraftTimeout(timeout);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInput(text);
    saveDraft(text);
    
    // Clear analysis when user starts typing new content
    if (analysis && text !== processingState.lastText) {
      clearAnalysis();
    }
  };

  const handleSubmit = async () => {
    try {
      const success = await processAIRequest(input);
      if (success) {
        setInput("");
        localStorage.removeItem('enhancedTaskDraft');
        onTaskCreated();
      }
    } catch (error) {
      console.error('Error in enhanced task creation:', error);
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
        localStorage.removeItem('enhancedTaskDraft');
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

  const enhancedExamples = [
    "Finish the quarterly report by end of this week, it's urgent and will take about 4 hours",
    "Set up a meeting with the design team tomorrow morning to review the new mockups", 
    "Research competitor pricing strategies for the product launch, low priority but important",
    "Review and approve the marketing budget proposal by Friday, should take 2 hours",
    "Complete the customer feedback analysis and create a summary presentation"
  ];

  const handleExampleClick = (example: string) => {
    setInput(example);
    saveDraft(example);
    clearAnalysis();
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="relative">
        <Textarea
          placeholder="Describe your task naturally with as much detail as you want - I'll use AI to understand context, priority, timing, and more..."
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="min-h-[120px] pr-32"
          aria-label="Enhanced task description"
          disabled={isProcessing}
        />
        
        {analysis && <EnhancedAIAnalysisDisplay analysis={analysis} />}
      </div>
      
      <EnhancedProcessingSteps 
        step={processingState.step}
        error={processingState.error}
        retryCount={processingState.retryCount}
        onRetry={handleRetry}
      />

      {!isProcessing && input.length === 0 && (
        <div className="text-xs text-muted-foreground">
          <p className="mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Try these enhanced examples (AI will analyze context and patterns):
          </p>
          <div className="space-y-1">
            {enhancedExamples.map((example, index) => (
              <button 
                key={index} 
                onClick={() => handleExampleClick(example)}
                className="text-left hover:text-primary text-xs block w-full truncate hover:bg-gray-50 p-1 rounded"
              >
                • {example}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button 
          onClick={handleSubmit} 
          disabled={isProcessing || input.trim().length === 0}
          className="flex-1"
        >
          <Wand2 className="mr-2 h-4 w-4" />
          {isProcessing ? "Processing with AI..." : "Process with Enhanced AI"}
        </Button>
        
        {processingState.error && processingState.retryCount < 3 && (
          <Button 
            onClick={handleRetry} 
            disabled={isProcessing}
            variant="outline"
            size="icon"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Press Cmd/Ctrl + Enter to submit • Enhanced with context awareness
      </p>
    </div>
  );
}
