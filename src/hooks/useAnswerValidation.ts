
import { supabase } from "@/integrations/supabase/client";
import { MultipleAnswerQuestion, Question } from "@/types/questions";

export const useAnswerValidation = () => {
  const validateAnswer = async (
    question: Question,
    userAnswer: string | string[],
    startTime: number
  ) => {
    const responseTime = Math.round((Date.now() - startTime) / 1000);

    // Sort arrays to ensure consistent comparison
    const processedUserAnswer = Array.isArray(userAnswer) 
      ? [...userAnswer].sort() 
      : userAnswer;

    const correctAnswers =
      question.type === "multiple-answer"
        ? [...(question as MultipleAnswerQuestion).correctAnswers].sort()
        : question.answer;


    const response = await supabase.functions.invoke("validateAnswerWithAI", {
      body: {
        question: question.question,
        userAnswers: processedUserAnswer,
        correctAnswers: correctAnswers,
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
