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
    const { data, error } = await supabase.functions.invoke<GeminiResponse>('generateLearningPlan', {
      body: { subject }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error generating learning plan:", error);
    toast.error("Failed to generate learning plan. Please try again.");
    throw error;
  }
};