
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type AIProvider = 'gemini' | 'deepseek' | 'gemini-pro' | 'gemini-2.5-pro' | 'openai';

export const useGenerateLesson = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiProvider, setAIProvider] = useState<AIProvider>('gemini-pro');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState("");
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
      const { data: lessonData, error: generateError } = await supabase.functions.invoke("generateLesson", {
        body: { 
          subject, 
          userId: user.id,
          isRetry,
          aiProvider,
          isPlacementTest,
          apiKey: apiKey || undefined, // Only send API key if provided
        },
      });

      if (generateError) {
        console.error("Error from generateLesson function:", generateError);
        if (generateError.message.includes('API quota exceeded')) {
          toast.error("We're experiencing high demand. Please try again in a few minutes.");
        } else {
          toast.error("Failed to generate lesson. Please try again.");
        }
        return null;
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
      toast.error(error.message || "Failed to generate lesson");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    handleGenerateLesson,
    aiProvider,
    setAIProvider,
    showApiKeyInput,
    setShowApiKeyInput,
    apiKey,
    setApiKey
  };
};
