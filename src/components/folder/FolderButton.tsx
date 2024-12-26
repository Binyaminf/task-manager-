import { Button } from "@/components/ui/button";
import { Folder, Trash2 } from "lucide-react";
import { FolderType } from "./types";

interface FolderButtonProps {
  folder: FolderType;
  isSelected: boolean;
  onClick: () => void;
  onDeleteClick: (e: React.MouseEvent) => void;
}

export function FolderButton({ folder, isSelected, onClick, onDeleteClick }: FolderButtonProps) {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();  // Stop event from bubbling up to parent button
    onDeleteClick(e);
  };

  return (
    <div className="relative inline-flex">
      <Button
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onClick={onClick}
        style={{ backgroundColor: isSelected ? folder.color : 'transparent' }}
        className="group"
      >
        <Folder 
          className="w-4 h-4 mr-2" 
          style={{ color: isSelected ? 'white' : folder.color }} 
        />
        {folder.name}
      </Button>
      <button
        onClick={handleDeleteClick}
        className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
        type="button"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}