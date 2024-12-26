import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Folder, FolderPlus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FolderForm } from "./FolderForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FolderType {
  id: string;
  name: string;
  description?: string;
  color: string;
  user_id: string;
}

export function FolderList({ onFolderSelect }: { onFolderSelect: (folderId: string | null) => void }) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: folders, refetch } = useQuery({
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
    refetch();
  };

  const handleFolderClick = (folderId: string) => {
    const newSelectedFolder = selectedFolder === folderId ? null : folderId;
    setSelectedFolder(newSelectedFolder);
    onFolderSelect(newSelectedFolder);
  };

  const handleDeleteClick = (e: React.MouseEvent, folder: FolderType) => {
    e.stopPropagation(); // Prevent folder selection when clicking delete
    setFolderToDelete(folder);
  };

  const handleDeleteConfirm = async () => {
    if (!folderToDelete) return;

    // First, update any tasks that use this folder to remove the folder_id
    const { error: taskUpdateError } = await supabase
      .from('tasks')
      .update({ folder_id: null })
      .eq('folder_id', folderToDelete.id);

    if (taskUpdateError) {
      toast({
        title: "Error",
        description: "Failed to update tasks",
        variant: "destructive",
      });
      return;
    }

    // Then delete the folder
    const { error: folderDeleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderToDelete.id);

    if (folderDeleteError) {
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
      
      if (selectedFolder === folderToDelete.id) {
        setSelectedFolder(null);
        onFolderSelect(null);
      }
      
      // Invalidate both folders and tasks queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
    
    setFolderToDelete(null);
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
      <div className="flex flex-wrap gap-2">
        {folders?.map((folder) => (
          <Button
            key={folder.id}
            variant={selectedFolder === folder.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleFolderClick(folder.id)}
            style={{ backgroundColor: selectedFolder === folder.id ? folder.color : 'transparent' }}
            className="group"
          >
            <Folder 
              className="w-4 h-4 mr-2" 
              style={{ color: selectedFolder === folder.id ? 'white' : folder.color }} 
            />
            {folder.name}
            <Trash2
              className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleDeleteClick(e, folder)}
            />
          </Button>
        ))}
      </div>

      <AlertDialog open={!!folderToDelete} onOpenChange={() => setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the folder
              "{folderToDelete?.name}" and remove it from any tasks that use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}