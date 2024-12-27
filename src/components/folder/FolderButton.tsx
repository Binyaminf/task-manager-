import { Button } from "@/components/ui/button";
import { Folder, Trash2 } from "lucide-react";
import { FolderType } from "./types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FolderButtonProps {
  folder: FolderType;
  isSelected: boolean;
  onClick: () => void;
  onDeleteClick: (e: React.MouseEvent) => void;
}

export function FolderButton({ folder, isSelected, onClick, onDeleteClick }: FolderButtonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isSelected ? folder.color : 'transparent',
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClick(e);
  };

  return (
    <div 
      ref={setNodeRef}
      className="relative inline-flex group cursor-move"
      style={style}
      {...attributes}
      {...listeners}
    >
      <Button
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onClick={onClick}
        className="pointer-events-none"
      >
        <Folder 
          className="w-4 h-4 mr-2" 
          style={{ color: isSelected ? 'white' : folder.color }} 
        />
        {folder.name}
        <div 
          onClick={handleDeleteClick}
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center pointer-events-auto"
        >
          <Trash2 className="w-4 h-4 hover:text-destructive" />
        </div>
      </Button>
    </div>
  );
}