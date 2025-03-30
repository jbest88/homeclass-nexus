
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
    console.log('Calling generateLearningPlan function for subject:', subject);
    
    const { data, error } = await supabase.functions.invoke<GeminiResponse>('generateLearningPlan', {
      body: { 
        subject,
        model: 'gemini-2.5-pro-exp-03-25'
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to generate learning plan');
    }

    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from Gemini API');
    }

    console.log('Successfully generated learning plan');
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error generating learning plan:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate learning plan';
    toast.error(errorMessage);
    throw error;
  }
};
