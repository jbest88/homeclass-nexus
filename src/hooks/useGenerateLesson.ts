import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const useGenerateLesson = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const user = useUser();
  const navigate = useNavigate();

  const { data: generatedLessons } = useQuery({
    queryKey: ["generated-lessons"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("generated_lessons")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleGenerateLesson = async (subject: string) => {
    try {
      setIsGenerating(true);
      
      const maxOrderIndex = generatedLessons?.reduce((max, lesson) => 
        lesson.subject === subject ? Math.max(max, lesson.order_index) : max, -1
      ) ?? -1;
      
      const { data: lessonData, error: generateError } = await supabase.functions.invoke("generateLesson", {
        body: { subject },
      });

      if (generateError) throw generateError;

      const { data: insertData, error: insertError } = await supabase
        .from("generated_lessons")
        .insert({
          user_id: user?.id,
          subject,
          title: lessonData.title,
          content: lessonData.content,
          questions: lessonData.questions,
          order_index: maxOrderIndex + 1,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("New lesson generated successfully!");
      navigate(`/generated-lesson/${insertData.id}`);
    } catch (error) {
      console.error("Error generating lesson:", error);
      toast.error("Failed to generate lesson");
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    handleGenerateLesson,
  };
};