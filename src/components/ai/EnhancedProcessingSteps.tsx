
import { CheckCircle, Circle, AlertCircle, RotateCw, Brain, Database, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EnhancedProcessingStepsProps {
  step: 'idle' | 'gathering-context' | 'analyzing' | 'creating' | 'complete';
  error: string | null;
  retryCount: number;
  onRetry: () => void;
}

export function EnhancedProcessingSteps({ step, error, retryCount, onRetry }: EnhancedProcessingStepsProps) {
  const steps = [
    {
      id: 'gathering-context',
      label: 'Gathering Context',
      description: 'Analyzing your task history and patterns',
      icon: Database,
    },
    {
      id: 'analyzing',
      label: 'AI Analysis',
      description: 'Processing with enhanced intelligence',
      icon: Brain,
    },
    {
      id: 'creating',
      label: 'Creating Task',
      description: 'Applying insights to create your task',
      icon: Sparkles,
    },
  ];

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === step);
    
    if (error) return 'error';
    if (step === 'complete') return 'complete';
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getStepIcon = (stepId: string, IconComponent: any) => {
    const status = getStepStatus(stepId);
    
    if (status === 'error') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (status === 'complete') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'active') return <RotateCw className="h-4 w-4 text-blue-500 animate-spin" />;
    return <Circle className="h-4 w-4 text-gray-300" />;
  };

  if (step === 'idle' && !error) return null;

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
      <div className="space-y-2">
        {steps.map((stepItem, index) => {
          const status = getStepStatus(stepItem.id);
          const IconComponent = stepItem.icon;
          
          return (
            <div
              key={stepItem.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded transition-colors",
                status === 'active' && "bg-blue-50",
                status === 'complete' && "bg-green-50",
                status === 'error' && "bg-red-50"
              )}
            >
              {getStepIcon(stepItem.id, IconComponent)}
              <div className="flex-1">
                <div className={cn(
                  "text-sm font-medium",
                  status === 'active' && "text-blue-700",
                  status === 'complete' && "text-green-700",
                  status === 'error' && "text-red-700",
                  status === 'pending' && "text-gray-500"
                )}>
                  {stepItem.label}
                </div>
                <div className="text-xs text-gray-600">
                  {stepItem.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {step === 'complete' && (
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-700 font-medium">
            Task created successfully with AI insights!
          </span>
        </div>
      )}

      {error && (
        <div className="space-y-2 p-3 bg-red-50 rounded border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700 font-medium">Processing Error</span>
          </div>
          <p className="text-sm text-red-600">{error}</p>
          {retryCount < 3 && (
            <Button
              onClick={onRetry}
              size="sm"
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <RotateCw className="h-3 w-3 mr-1" />
              Retry ({retryCount}/3)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
