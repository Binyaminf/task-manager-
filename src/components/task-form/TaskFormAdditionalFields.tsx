import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Task } from "@/types/task";

interface TaskFormAdditionalFieldsProps {
  formData: Partial<Task>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setFormData: (data: (prev: Partial<Task>) => Partial<Task>) => void;
}

export function TaskFormAdditionalFields({ 
  formData, 
  handleInputChange,
  setFormData 
}: TaskFormAdditionalFieldsProps) {
  return (
    <>
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
    </>
  );
}
