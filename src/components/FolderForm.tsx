import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FolderType } from "./folder/types";

type FolderFormData = Omit<FolderType, 'id' | 'user_id'>;

interface FolderFormProps {
  onSubmit: (folder: FolderFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<FolderFormData>;
}

const defaultFormData: FolderFormData = {
  name: "",
  description: "",
  color: "#94a3b8",
};

export function FolderForm({ onSubmit, onCancel, initialData }: FolderFormProps) {
  const [formData, setFormData] = useState<FolderFormData>({
    ...defaultFormData,
    ...initialData,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
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
        <Label htmlFor="color">Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleInputChange}
            className="w-12 h-10 p-1"
          />
          <Input
            type="text"
            value={formData.color}
            onChange={handleInputChange}
            name="color"
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">Save Folder</Button>
      </div>
    </form>
  );
}