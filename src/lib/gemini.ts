import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export const generateLearningPlan = async (subject: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('generateLearningPlan', {
      body: { subject }
    });

    if (error) throw error;

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error generating learning plan:", error);
    toast.error("Failed to generate learning plan");
    throw error;
  }
};