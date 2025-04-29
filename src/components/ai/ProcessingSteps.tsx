
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleX, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProcessingStepsProps {
  step: 'idle' | 'analyzing' | 'creating' | 'complete';
  error: string | null;
  onRetry?: () => void;
}

export function ProcessingSteps({ step, error, onRetry }: ProcessingStepsProps) {
  const steps = {
    idle: 0,
    analyzing: 33,
    creating: 66,
    complete: 100
  };

  const stepMessages = {
    analyzing: "Analyzing your request with AI...",
    creating: "Creating your task based on analysis...",
    complete: "Task created successfully!"
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mt-2 relative overflow-hidden">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div className="space-y-2">
            <AlertDescription>{error}</AlertDescription>
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="mt-2 flex items-center gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Try again
              </Button>
            )}
          </div>
        </div>
      </Alert>
    );
  }

  if (step === 'idle') {
    return null;
  }

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <Progress value={steps[step]} className="flex-1" />
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          {Math.round(steps[step])}%
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {stepMessages[step]}
      </p>
    </div>
  );
}
