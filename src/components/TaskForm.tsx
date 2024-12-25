import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Task } from "./TaskCard";
import { TaskFormFields } from "./task-form/TaskFormFields";
import { TaskFormSelects } from "./task-form/TaskFormSelects";
import { TaskFormAdditionalFields } from "./task-form/TaskFormAdditionalFields";

interface TaskFormProps {
  onSubmit: (task: Partial<Task>) => void;
  onCancel?: () => void;
  initialData?: Partial<Task>;
}

export function TaskForm({ onSubmit, onCancel, initialData }: TaskFormProps) {
  const [formData, setFormData] = useState<Partial<Task>>(
    initialData || {
      summary: "",
      description: "",
      dueDate: new Date().toISOString(),
      estimatedDuration: "1h",
      priority: "Medium",
      status: "To Do",
      category: "General",
      externalLinks: [],
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

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
    if (date) {
      setFormData((prev) => ({ ...prev, dueDate: date.toISOString() }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">Save Task</Button>
      </div>
    </form>
  );
}