import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskCardHeaderProps {
  summary: string;
  onClick: () => void;
  onDelete: () => void;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export const TaskCardHeader = ({
  summary,
  onClick,
  onDelete,
  isSelected,
  onSelect,
}: TaskCardHeaderProps) => {
  return (
    <CardHeader className="pb-2 px-3 sm:px-6">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {onSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 h-5 w-5 sm:h-4 sm:w-4 touch-manipulation transition-transform duration-200 hover:scale-110"
            />
          )}
          <CardTitle 
            className="text-base sm:text-lg font-semibold truncate cursor-pointer transition-colors hover:text-primary"
            onClick={() => onClick()}
          >
            {summary}
          </CardTitle>
        </div>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="h-10 w-10 sm:h-9 sm:w-9 touch-manipulation transition-transform duration-200 hover:scale-110"
          >
            <Edit2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-10 w-10 sm:h-9 sm:w-9 text-destructive touch-manipulation transition-transform duration-200 hover:scale-110"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};