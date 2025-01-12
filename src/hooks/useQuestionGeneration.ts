import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Question } from "@/types/questions";
import { toast } from "sonner";

export const useQuestionGeneration = (lessonId: string, subject: string) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateNewQuestions = async (
    userId: string | undefined,
    profile: { grade_level: number } | null
  ) => {
    if (!userId || !profile) return null;
    
    try {
      setIsGenerating(true);
      
      const { data: proficiencyData } = await supabase
        .from("subject_proficiency")
        .select("proficiency_level")
        .eq("user_id", userId)
        .eq("subject", subject)
        .single();

      const proficiencyLevel = proficiencyData?.proficiency_level || 1;
      const gradeLevelText = profile.grade_level === 0 ? 
        "Kindergarten" : 
        `Grade ${profile.grade_level}`;

      const { data, error } = await supabase.functions.invoke("generateQuestions", {
        body: {
          lessonId,
          userId,
          gradeLevelText,
          difficultyLevel: proficiencyLevel,
          proficiencyLevel,
        },
      });

      if (error) throw error;

      toast.success("New practice questions generated!");
      return data.questions as Question[];
      
    } catch (error) {
      console.error("Error generating new questions:", error);
      toast.error("Failed to generate new questions");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generateNewQuestions,
  };
};