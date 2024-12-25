import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Folder, FolderPlus } from "lucide-react";
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

export interface FolderType {
  id: string;
  name: string;
  description?: string;
  color: string;
  user_id: string;
}

export function FolderList({ onFolderSelect }: { onFolderSelect: (folderId: string | null) => void }) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleFolderCreate = async (folder: Partial<FolderType>) => {
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
          >
            <Folder className="w-4 h-4 mr-2" style={{ color: selectedFolder === folder.id ? 'white' : folder.color }} />
            {folder.name}
          </Button>
        ))}
      </div>
    </div>
  );
}