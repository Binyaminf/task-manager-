import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Task } from "@/types/task";
import { ChevronDown, Trash2, FolderOpen, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BatchActionsProps {
  selectedTasks: Task[];
  onStatusChange: (status: Task['status']) => void;
  onDelete: () => void;
  onMoveToFolder: (folderId: string | null) => void;
}

export function BatchActions({ 
  selectedTasks,
  onStatusChange,
  onDelete,
  onMoveToFolder,
}: BatchActionsProps) {
  const { data: folders } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching folders:', error);
        return [];
      }
      
      return data;
    },
  });

  if (selectedTasks.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-lg">
      <span className="text-sm font-medium">
        {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Set Status <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onStatusChange("To Do")}>
            To Do
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange("In Progress")}>
            In Progress
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange("Done")}>
            Done
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Move to Folder <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onMoveToFolder(null)}>
            No Folder
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {folders?.map((folder) => (
            <DropdownMenuItem 
              key={folder.id}
              onClick={() => onMoveToFolder(folder.id)}
            >
              {folder.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button 
        variant="destructive" 
        size="sm"
        onClick={onDelete}
      >
        Delete Selected
      </Button>
    </div>
  );
}