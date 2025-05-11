import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FolderForm } from "./FolderForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FolderButton } from "./folder/FolderButton";
import { FolderDeleteDialog } from "./folder/FolderDeleteDialog";
import { FolderType } from "./folder/types";
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

interface FolderListProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

export function FolderList({ selectedFolder, onFolderSelect }: FolderListProps) {
  const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name');
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load folders",
          variant: "destructive",
        });
        return [];
      }
      return data;
    },
  });

  const handleFolderCreate = async (folder: Omit<FolderType, 'id' | 'user_id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create folders",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('folders')
      .insert([{ ...folder, user_id: user.id }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Folder created successfully",
    });
    queryClient.invalidateQueries({ queryKey: ['folders'] });
  };

  const handleFolderClick = (folderId: string) => {
    const newSelectedFolder = selectedFolder === folderId ? null : folderId;
    onFolderSelect(newSelectedFolder);
  };

  const handleDeleteClick = (e: React.MouseEvent, folder: FolderType) => {
    e.stopPropagation();
    setFolderToDelete(folder);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = folders.findIndex((folder) => folder.id === active.id);
    const newIndex = folders.findIndex((folder) => folder.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newFolders = arrayMove(folders, oldIndex, newIndex);
      
      // Optimistically update the UI
      queryClient.setQueryData(['folders'], newFolders);
      
      // Update the order in the database
      // Note: In a real application, you might want to store and update a separate 'order' field
      toast({
        title: "Success",
        description: "Folder order updated",
      });
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Folders</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <FolderForm onSubmit={handleFolderCreate} />
          </DialogContent>
        </Dialog>
      </div>
      
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-wrap gap-2">
          <SortableContext items={folders.map(f => f.id)} strategy={horizontalListSortingStrategy}>
            {folders?.map((folder) => (
              <FolderButton
                key={folder.id}
                folder={folder}
                isSelected={selectedFolder === folder.id}
                onClick={() => handleFolderClick(folder.id)}
                onDeleteClick={(e) => handleDeleteClick(e, folder)}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      <FolderDeleteDialog
        folderToDelete={folderToDelete}
        selectedFolder={selectedFolder}
        onFolderSelect={onFolderSelect}
        onClose={() => setFolderToDelete(null)}
      />
    </div>
  );
}
