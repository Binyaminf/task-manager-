
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Task } from "@/types/task";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarRange, Clock, ListChecks, Notebook, Tag, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface TaskTemplatesProps {
  open: boolean;
  onClose: () => void;
  onCreateTask: (task: Partial<Task>) => Promise<void>;
}

const TEMPLATES: Array<{
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  task: Partial<Task>;
}> = [
  {
    id: "daily",
    title: "Daily Task",
    description: "A simple task to be completed today",
    icon: CalendarRange,
    task: {
      summary: "Daily Task",
      priority: "Medium",
      status: "To Do",
      category: "Daily",
      dueDate: new Date().toISOString().split("T")[0],
    },
  },
  {
    id: "meeting",
    title: "Meeting Notes",
    description: "Template for meeting minutes and actions",
    icon: Notebook,
    task: {
      summary: "Meeting Notes",
      description: "## Agenda\n\n- Item 1\n- Item 2\n\n## Actions\n\n- [ ] Action 1\n- [ ] Action 2",
      priority: "Medium",
      status: "To Do",
      category: "Meetings",
      estimatedDuration: "60m",
    },
  },
  {
    id: "project",
    title: "Project Task",
    description: "A task with subtasks and tracking",
    icon: ListChecks,
    task: {
      summary: "Project Task",
      description: "## Objective\n\n## Subtasks\n\n- [ ] Step 1\n- [ ] Step 2\n- [ ] Step 3",
      priority: "High",
      status: "To Do",
      category: "Projects",
      estimatedDuration: "4h",
    },
  },
  {
    id: "reminder",
    title: "Reminder",
    description: "A simple reminder with a due date",
    icon: Clock,
    task: {
      summary: "Reminder",
      priority: "Low",
      status: "To Do",
      category: "Reminders",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
  },
  {
    id: "idea",
    title: "Idea",
    description: "Capture a new idea or concept",
    icon: Tag,
    task: {
      summary: "New Idea",
      description: "## Description\n\n## Potential Impact\n\n## Next Steps",
      priority: "Medium",
      status: "To Do",
      category: "Ideas",
    },
  }
];

export function TaskTemplates({ open, onClose, onCreateTask }: TaskTemplatesProps) {
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSelectTemplate = async (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    setIsSubmitting(templateId);
    
    try {
      await onCreateTask(template.task);
      toast({
        title: "Success",
        description: `Created "${template.title}" task`,
      });
      onClose();
    } catch (error) {
      console.error("Error creating task from template:", error);
      toast({
        title: "Error",
        description: "Failed to create task from template",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task Templates</DialogTitle>
          <DialogDescription>
            Choose a template to quickly create a task with predefined fields.
          </DialogDescription>
        </DialogHeader>
        
        <div className={`grid ${isMobile ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"} gap-4 py-4`}>
          {TEMPLATES.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <template.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{template.title}</CardTitle>
                <CardDescription className="text-xs">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-xs text-muted-foreground">
                  <div>Priority: {template.task.priority}</div>
                  {template.task.category && <div>Category: {template.task.category}</div>}
                  {template.task.dueDate && <div>Due: {template.task.dueDate}</div>}
                  {template.task.estimatedDuration && <div>Time: {template.task.estimatedDuration}</div>}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSelectTemplate(template.id)} 
                  disabled={isSubmitting !== null}
                  variant="outline" 
                  className="w-full"
                >
                  {isSubmitting === template.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Use Template"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
