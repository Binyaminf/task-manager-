
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task } from "@/types/task";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface BatchTaskCreationProps {
  open: boolean;
  onClose: () => void;
  onCreateTasks: (tasks: Partial<Task>[]) => Promise<void>;
}

const TEMPLATES = {
  basic: {
    name: "Basic Tasks",
    description: "Create simple tasks with titles only",
    example: "Buy groceries\nCall dentist\nPay bills",
  },
  detailed: {
    name: "Detailed Tasks",
    description: "Format: Task | Priority | Category | Due Date",
    example: "Buy groceries | Medium | Shopping | 2025-05-20\nCall dentist | High | Health | 2025-05-15\nPay bills | High | Finance | 2025-05-12",
  },
};

type TemplateKey = keyof typeof TEMPLATES;

export function BatchTaskCreation({ open, onClose, onCreateTasks }: BatchTaskCreationProps) {
  const [taskText, setTaskText] = useState<string>("");
  const [template, setTemplate] = useState<TemplateKey>("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleTemplateChange = (value: string) => {
    setTemplate(value as TemplateKey);
  };

  const loadTemplateExample = () => {
    setTaskText(TEMPLATES[template].example);
  };

  const parseTasks = (): Partial<Task>[] => {
    if (!taskText.trim()) return [];

    const lines = taskText.split("\n").filter(line => line.trim());
    
    if (template === "basic") {
      return lines.map(line => ({
        summary: line.trim(),
        priority: "Medium" as Task["priority"],
        status: "To Do" as Task["status"],
      }));
    } else if (template === "detailed") {
      return lines.map(line => {
        const parts = line.split("|").map(part => part.trim());
        return {
          summary: parts[0] || "Untitled Task",
          priority: (parts[1] as Task["priority"]) || "Medium",
          category: parts[2] || "",
          dueDate: parts[3] || new Date().toISOString().split("T")[0],
          status: "To Do" as Task["status"],
        };
      });
    }
    
    return [];
  };

  const handleSubmit = async () => {
    const tasks = parseTasks();
    
    if (tasks.length === 0) {
      toast({
        title: "No tasks to create",
        description: "Please enter at least one task",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onCreateTasks(tasks);
      toast({
        title: "Success",
        description: `Created ${tasks.length} tasks`,
      });
      setTaskText("");
      onClose();
    } catch (error) {
      console.error("Error creating tasks:", error);
      toast({
        title: "Error",
        description: "Failed to create tasks",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Multiple Tasks</DialogTitle>
          <DialogDescription>
            Enter one task per line. Use the template selector to choose a format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="template">Template</Label>
              <Select value={template} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={loadTemplateExample} className="mb-[2px]">
              Load Example
            </Button>
          </div>
          
          <div>
            <Label htmlFor="tasks">Tasks</Label>
            <Textarea
              id="tasks"
              placeholder={TEMPLATES[template].description}
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Tasks...
              </>
            ) : (
              "Create Tasks"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
