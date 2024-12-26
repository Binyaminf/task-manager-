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
import { FolderType } from "./FolderList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface FolderDeleteDialogProps {
  folderToDelete: FolderType | null;
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onClose: () => void;
}

export function FolderDeleteDialog({ 
  folderToDelete, 
  selectedFolder, 
  onFolderSelect, 
  onClose 
}: FolderDeleteDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      
      // If we're deleting the currently selected folder, clear the selection
      if (selectedFolder === folderToDelete.id) {
        onFolderSelect(null);
      }
      
      // Invalidate both folders and tasks queries to refresh the UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['folders'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      ]);
    }
    
    onClose();
  };

  return (
    <AlertDialog open={!!folderToDelete} onOpenChange={() => onClose()}>
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
  );
}