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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FolderButton } from "./folder/FolderButton";
import { FolderDeleteDialog } from "./folder/FolderDeleteDialog";
import { FolderType } from "./folder/types";

export function FolderList({ onFolderSelect }: { onFolderSelect: (folderId: string | null) => void }) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null);
  const { toast } = useToast();

  const { data: folders } = useQuery({
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
          <FolderButton
            key={folder.id}
            folder={folder}
            isSelected={selectedFolder === folder.id}
            onClick={() => handleFolderClick(folder.id)}
            onDeleteClick={(e) => handleDeleteClick(e, folder)}
          />
        ))}
      </div>

      <FolderDeleteDialog
        folderToDelete={folderToDelete}
        selectedFolder={selectedFolder}
        onFolderSelect={onFolderSelect}
        onClose={() => setFolderToDelete(null)}
      />
    </div>
  );
}