import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

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

  const handleGenerateLesson = async (subject: string, isRetry: boolean = false) => {
    if (!user) {
      toast.error("Please sign in to generate lessons");
      return null;
    }

    let attempt = 0;
    let lastError = null;

    while (attempt < MAX_RETRIES) {
      try {
        setIsGenerating(true);
        
        const maxOrderIndex = generatedLessons?.reduce((max, lesson) => 
          lesson.subject === subject ? Math.max(max, lesson.order_index) : max, -1
        ) ?? -1;

        console.log(`Attempting to generate lesson (attempt ${attempt + 1}/${MAX_RETRIES})`);
        
        const { data: lessonData, error: generateError } = await supabase.functions.invoke(
          "generateLesson",
          {
            body: { 
              subject, 
              userId: user.id,
              isRetry,
            },
          }
        );

        if (generateError) {
          console.error('Generation error:', generateError);
          throw generateError;
        }

        if (!lessonData) {
          throw new Error('No lesson data received');
        }

        console.log('Lesson generated successfully, inserting into database');

        const { data: insertData, error: insertError } = await supabase
          .from("generated_lessons")
          .insert({
            user_id: user.id,
            subject,
            title: lessonData.title,
            content: lessonData.content,
            questions: lessonData.questions,
            order_index: maxOrderIndex + 1,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Database insertion error:', insertError);
          throw insertError;
        }

        toast.success(isRetry 
          ? "New approach generated! Let's try this topic again." 
          : "New lesson generated successfully!");
        
        navigate(`/generated-lesson/${insertData.id}`);
        return insertData;

      } catch (error) {
        console.error(`Error in attempt ${attempt + 1}:`, error);
        lastError = error;
        
        // If this is not the last attempt, wait before retrying
        if (attempt < MAX_RETRIES - 1) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
        } else {
          break;
        }
      }
    }

    // If we've exhausted all retries, show error
    console.error('All retry attempts failed:', lastError);
    toast.error("Failed to generate lesson. Please try again later.");
    setIsGenerating(false);
    return null;
  };

  return {
    isGenerating,
    handleGenerateLesson,
  };
};