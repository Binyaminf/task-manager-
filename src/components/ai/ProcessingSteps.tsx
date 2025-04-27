
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleX } from "lucide-react";

interface ProcessingStepsProps {
  step: 'idle' | 'analyzing' | 'creating' | 'complete';
  error: string | null;
}

export function ProcessingSteps({ step, error }: ProcessingStepsProps) {
  const steps = {
    idle: 0,
    analyzing: 33,
    creating: 66,
    complete: 100
  };

  const stepMessages = {
    analyzing: "Analyzing your request...",
    creating: "Creating your task...",
    complete: "Task created successfully!"
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mt-2">
        <CircleX className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (step === 'idle') {
    return null;
  }

  return (
    <div className="space-y-2 mt-2">
      <Progress value={steps[step]} />
      <p className="text-sm text-muted-foreground">
        {stepMessages[step]}
      </p>
    </div>
  );
}
