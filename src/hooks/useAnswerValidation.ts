import { supabase } from "@/integrations/supabase/client";
import { Question } from "@/types/questions";

export const useAnswerValidation = () => {
  const validateAnswer = async (
    question: Question,
    userAnswer: string | string[],
    startTime: number
  ) => {
    const responseTime = Math.round((Date.now() - startTime) / 1000);

    const response = await supabase.functions.invoke("validateAnswerWithAI", {
      body: {
        question: question.question,
        userAnswers: userAnswer,
        correctAnswers: question.type === 'multiple-answer' 
          ? (question as any).correctAnswers 
          : question.answer,
        type: question.type,
      },
    });

    if (response.error) throw response.error;

    return {
      isCorrect: response.data.isCorrect,
      explanation: response.data.explanation,
      responseTime,
    };
  };

  return { validateAnswer };
};