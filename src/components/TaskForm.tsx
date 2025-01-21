import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskFormFields } from "./task-form/TaskFormFields";
import { TaskFormSelects } from "./task-form/TaskFormSelects";
import { TaskFormAdditionalFields } from "./task-form/TaskFormAdditionalFields";
import { Task } from "./TaskCard";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Partial<Task>) => void;
  initialData?: Partial<Task>;
}

export function TaskForm({ open, onOpenChange, onSubmit, initialData }: TaskFormProps) {
  const [formData, setFormData] = useState<Partial<Task>>(
    initialData || {
      summary: "",
      description: "",
      dueDate: undefined,
      estimatedDuration: "",
      priority: "Medium",
      status: "To Do",
      category: "",
      externalLinks: [],
      folder_id: null,
    }
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, dueDate: date?.toISOString() }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] sm:h-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] sm:max-h-[600px] px-1">
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid gap-6">
              <TaskFormFields
                formData={formData}
                handleInputChange={handleInputChange}
                handleDateChange={handleDateChange}
              />
              <TaskFormSelects
                formData={formData}
                handleSelectChange={handleSelectChange}
              />
              <TaskFormAdditionalFields
                formData={formData}
                handleInputChange={handleInputChange}
                setFormData={setFormData}
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}