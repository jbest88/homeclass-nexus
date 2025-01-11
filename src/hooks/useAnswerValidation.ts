import { supabase } from "@/integrations/supabase/client";
import { Question } from "@/types/questions";

export const useAnswerValidation = () => {
  const validateAnswer = async (
    question: Question,
    userAnswer: string | string[],
    startTime: number
  ) => {
    const responseTime = Math.round((Date.now() - startTime) / 1000);

    const response = await supabase.functions.invoke("validateWithAI", {
      body: {
        question: question.question,
        userAnswer,
        correctAnswer: question.answer,
        type: question.type,
        mode: "validate_answer",
        ...(question.type === 'multiple-answer' && { 
          correctAnswers: (question as any).correctAnswers 
        }),
      },
    });

    if (response.error) throw response.error;

    const { isCorrect, explanation } = response.data;

    return {
      isCorrect,
      explanation,
      responseTime,
    };
  };

  return { validateAnswer };
};