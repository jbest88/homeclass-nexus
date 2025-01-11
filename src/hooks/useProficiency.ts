import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "sonner";

export const useProficiency = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  const updateProficiencyMutation = useMutation({
    mutationFn: async ({ subject, isCorrect }: { subject: string; isCorrect: boolean }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Use upsert operation with the unique constraint
      const { data, error } = await supabase
        .from("subject_proficiency")
        .upsert(
          {
            user_id: user.id,
            subject,
            proficiency_level: isCorrect ? 2 : 1,
            total_questions_attempted: 1,
            correct_answers: isCorrect ? 1 : 0,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,subject',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) throw error;

      // If we have existing data, update the counts and proficiency
      if (data) {
        const newProficiency = isCorrect 
          ? Math.min(data.proficiency_level + 1, 10)
          : Math.max(data.proficiency_level - 1, 1);

        return supabase
          .from("subject_proficiency")
          .update({
            proficiency_level: newProficiency,
            total_questions_attempted: data.total_questions_attempted + 1,
            correct_answers: data.correct_answers + (isCorrect ? 1 : 0),
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id)
          .select()
          .single();
      }

      return { data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject-proficiency"] });
    },
    onError: (error) => {
      console.error("Error updating proficiency:", error);
      toast.error("Failed to update proficiency level");
    },
  });

  return { updateProficiencyMutation };
};