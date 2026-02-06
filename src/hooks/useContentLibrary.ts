import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type ContentType = "video" | "pdf" | "link" | "text";

export interface ContentItem {
  id: string;
  coach_id: string;
  title: string;
  type: ContentType;
  url: string | null;
  tags: string[];
  created_at: string;
}

export interface CreateContentPayload {
  title: string;
  type: ContentType;
  url?: string;
  tags?: string[];
}

export function useContentLibrary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: content = [], isLoading } = useQuery({
    queryKey: ["content-library", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("content_library")
        .select("*")
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContentItem[];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateContentPayload) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("content_library")
        .insert({
          coach_id: user.id,
          title: payload.title,
          type: payload.type,
          url: payload.url || null,
          tags: payload.tags || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-library"] });
      toast.success("Resource added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add resource: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase
        .from("content_library")
        .delete()
        .eq("id", contentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-library"] });
      toast.success("Resource deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete resource: " + error.message);
    },
  });

  // Get unique tags from all content
  const allTags = [...new Set(content.flatMap((item) => item.tags))];

  return {
    content,
    isLoading,
    allTags,
    createContent: createMutation.mutate,
    isCreating: createMutation.isPending,
    deleteContent: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
