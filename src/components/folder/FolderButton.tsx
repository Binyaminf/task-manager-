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
    <Button
      variant={isSelected ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      style={{ backgroundColor: isSelected ? folder.color : 'transparent' }}
      className="group relative"
    >
      <Folder 
        className="w-4 h-4 mr-2" 
        style={{ color: isSelected ? 'white' : folder.color }} 
      />
      {folder.name}
      <Trash2
        className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        onClick={handleDeleteClick}
      />
    </Button>
  );
}