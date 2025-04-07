
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type AIProvider = 'gemini-1.5-pro' | 'gemini-1.0-pro' | 'gemini-1.5-flash';

// Define a proper type for the response from the generateLesson function
interface LessonContent {
  title: string;
  content: string;
  questions: any[];
}

interface LessonResponse {
  data?: LessonContent;
  error?: {
    message: string;
  };
}

export const useGenerateLesson = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini-1.5-pro');
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
      let response;
      try {
        response = await Promise.race([
          functionPromise,
          timeoutPromise
        ]);
      } catch (error) {
        console.error("Error during function call:", error);
        throw new Error(error instanceof Error ? error.message : "Unknown error during function call");
      }

      // Check for errors in the response
      if (response.error) {
        console.error("Error from Edge Function:", response.error);
        throw new Error(response.error.message || "Failed to generate lesson");
      }

      // Ensure there's data in the response
      if (!response.data) {
        console.error("No data returned from the server");
        throw new Error("No data returned from the server");
      }

      // Extract the actual data we need
      const lessonData = response.data as LessonContent;
      
      // Now we can safely access properties
      if (!lessonData.title || !lessonData.content) {
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
      
      // Enhanced error handling with more specific messages
      if (error.message === "Request timed out") {
        toast.error("Request timed out. Please try again.");
      } else if (error.message && 
         (error.message.includes('API quota exceeded') || 
          error.message.includes('rate limit'))) {
        toast.error("We're experiencing high demand. Please try again in a few minutes.");
      } else if (error.message && 
         (error.message.includes('Gateway') || 
          error.message.includes('temporarily unavailable') || 
          error.message.includes('502') || 
          error.message.includes('503') || 
          error.message.includes('504'))) {
        toast.error("Connection error with AI service. Please try again in a few moments.");
      } else if (error.message && error.message.includes('No content generated')) {
        toast.error("AI model couldn't generate content at this time. Please try again or choose a different subject.");
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
    setAiProvider
  };
};
