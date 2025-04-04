
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type AIProvider = 'gemini-2.5-pro-exp-03-25';

export const useGenerateLesson = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiProvider] = useState<AIProvider>('gemini-2.5-pro-exp-03-25');
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

  const handleGenerateLesson = async (subject: string, isRetry: boolean = false, isPlacementTest: boolean = false) => {
    if (!user) {
      toast.error("Please sign in to generate lessons");
      return null;
    }

    try {
      setIsGenerating(true);
      console.log("Starting lesson generation with provider:", aiProvider);
      
      const maxOrderIndex = generatedLessons?.reduce((max, lesson) => 
        lesson.subject === subject ? Math.max(max, lesson.order_index) : max, -1
      ) ?? -1;
      
      console.log("Calling generateLesson function...");
      
      // Set up a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), 60000); // 60 seconds timeout
      });
      
      // Define the response type for the function call
      interface LessonResponse {
        data?: {
          title: string;
          content: string;
          questions: any[];
        };
        error?: {
          message: string;
        };
      }
      
      // Create the function promise with proper type annotation
      const functionPromise = supabase.functions.invoke<LessonResponse>("generateLesson", {
        body: { 
          subject, 
          userId: user.id,
          isRetry,
          aiProvider,
          isPlacementTest,
        }
      });
      
      // Race between the function call and the timeout
      const result = await Promise.race([
        functionPromise,
        timeoutPromise
      ]);

      // Check for errors in the response with proper type checking
      if (result.error) {
        console.error("Error from Edge Function:", result.error);
        throw new Error(result.error.message || "Failed to generate lesson");
      }

      const lessonData = result.data;
      if (!lessonData || !lessonData.title || !lessonData.content) {
        console.error("Invalid lesson data returned:", lessonData);
        throw new Error("Invalid lesson data returned from the server");
      }

      console.log("Lesson generated, inserting into database...");
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
        console.error("Error inserting lesson:", insertError);
        toast.error("Failed to save lesson. Please try again.");
        return null;
      }

      toast.success(isPlacementTest 
        ? "Placement test generated successfully!" 
        : isRetry 
          ? "New approach generated! Let's try this topic again." 
          : "New lesson generated successfully!");
      navigate(`/generated-lesson/${insertData.id}`);
      
      return insertData;
    } catch (error: any) {
      console.error("Error generating lesson:", error);
      if (error.message === "Request timed out") {
        toast.error("Request timed out. Please try again.");
      } else if (error.message && 
         (error.message.includes('API quota exceeded') || 
          error.message.includes('rate limit'))) {
        toast.error("We're experiencing high demand. Please try again in a few minutes.");
      } else if (error.message && 
         (error.message.includes('Gateway') || 
          error.message.includes('502') || 
          error.message.includes('503') || 
          error.message.includes('504'))) {
        toast.error("Connection error with AI service. Please try again in a few moments.");
      } else {
        toast.error(error.message || "Failed to generate lesson. Please try again later.");
      }
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    handleGenerateLesson,
    aiProvider,
  };
};
