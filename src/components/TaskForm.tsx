import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task } from "./TaskCard";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

  const { data: folders } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error loading folders:', error);
        return [];
      }
      return data;
    },
  });

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
      <div>
        <Label htmlFor="summary">Summary</Label>
        <Input
          id="summary"
          name="summary"
          value={formData.summary}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <Label>Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.dueDate ? (
                format(new Date(formData.dueDate), "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.dueDate ? new Date(formData.dueDate) : undefined}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label>Folder</Label>
        <Select
          value={formData.folder_id || "none"}
          onValueChange={(value) => handleSelectChange("folder_id", value === "none" ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Folder</SelectItem>
            {folders?.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                {folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="estimatedDuration">Estimated Duration</Label>
        <Input
          id="estimatedDuration"
          name="estimatedDuration"
          value={formData.estimatedDuration}
          onChange={handleInputChange}
          placeholder="e.g., 2h, 1d"
          required
        />
      </div>

      <div>
        <Label>Priority</Label>
        <Select
          value={formData.priority}
          onValueChange={(value) => handleSelectChange("priority", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => handleSelectChange("status", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="To Do">To Do</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="externalLinks">External Links (comma-separated)</Label>
        <Input
          id="externalLinks"
          name="externalLinks"
          value={formData.externalLinks?.join(", ") || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              externalLinks: e.target.value.split(",").map((link) => link.trim()),
            }))
          }
          placeholder="https://example.com, https://another.com"
        />
      </div>

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