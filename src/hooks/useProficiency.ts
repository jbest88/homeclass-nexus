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

      const { data: existing } = await supabase
        .from("subject_proficiency")
        .select("*")
        .eq("user_id", user.id)
        .eq("subject", subject)
        .maybeSingle();

      if (existing) {
        const newProficiency = isCorrect 
          ? Math.min(existing.proficiency_level + 1, 10)
          : Math.max(existing.proficiency_level - 1, 1);

        return supabase
          .from("subject_proficiency")
          .update({
            proficiency_level: newProficiency,
            total_questions_attempted: existing.total_questions_attempted + 1,
            correct_answers: existing.correct_answers + (isCorrect ? 1 : 0),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        return supabase
          .from("subject_proficiency")
          .insert({
            user_id: user.id,
            subject,
            proficiency_level: isCorrect ? 2 : 1,
            total_questions_attempted: 1,
            correct_answers: isCorrect ? 1 : 0,
          })
          .select()
          .single();
      }
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