import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { FolderType } from "./types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";

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
    setNodeRef: setSortableRef,
    transform,
    transition,
  } = useSortable({
    id: folder.id,
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `folder-${folder.id}`,
  });

  // Combine the refs
  const setRefs = (element: HTMLElement | null) => {
    setSortableRef(element);
    setDroppableRef(element);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setRefs}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative"
    >
      <Button
        variant={isSelected ? "default" : "outline"}
        className={`cursor-pointer ${isSelected ? "bg-primary" : ""}`}
        onClick={onClick}
      >
        {folder.name}
        <div 
          onClick={onDeleteClick}
          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center"
        >
          <Trash2 className="w-4 h-4 hover:text-destructive" />
        </div>
      </Button>
    </div>
  );
}