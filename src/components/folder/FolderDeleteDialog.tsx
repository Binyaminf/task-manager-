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
import { FolderType } from "./types";
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

    // Delete the folder - tasks will automatically have their folder_id set to null
    // due to the ON DELETE SET NULL constraint we added
    const { error: folderDeleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderToDelete.id);

    if (folderDeleteError) {
      console.error('Error deleting folder:', folderDeleteError);
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