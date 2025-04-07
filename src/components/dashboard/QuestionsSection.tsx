
import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { QuestionComponent } from "../lesson/QuestionComponent";
import { QuestionActionButtons } from "../lesson/QuestionActionButtons";
import { useQuestionResponses } from "@/hooks/useQuestionResponses";
import { useGenerateLesson } from "@/hooks/useGenerateLesson";
import { useLearningPath } from "@/hooks/useLearningPath";
import { supabase } from "@/integrations/supabase/client";
import { Question } from "@/types/questions";

interface QuestionsSectionProps {
  questions: Question[];
  lessonId: string;
  subject: string;
}

export const QuestionsSection = ({ questions, lessonId, subject }: QuestionsSectionProps) => {
  const navigate = useNavigate();
  const user = useUser();
  const { handleGenerateLesson, isGenerating } = useGenerateLesson();
  const { addToLearningPath } = useLearningPath();

  const { data: previousResponses } = useQuery({
    queryKey: ["question-responses", lessonId],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("question_responses")
        .select("*")
        .eq("lesson_id", lessonId)
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!lessonId,
  });

  const {
    answers,
    isSubmitting,
    isSubmitted,
    performance,
    handleAnswerChange,
    handleSubmit,
    resetAnswers,
    setIsSubmitted,
  } = useQuestionResponses(lessonId, subject, false);

  const handleContinue = () => {
    navigate("/dashboard");
  };

  const handleTryAgain = () => {
    resetAnswers();
    setIsSubmitted(false);
  };

  const validateAnswers = () => {
    const unansweredQuestions = questions.filter((_, index) => {
      const answer = answers[index]?.answer;
      return !answer || (Array.isArray(answer) && answer.length === 0);
    });

    if (unansweredQuestions.length > 0) {
      toast.error("Please answer all questions before submitting.");
      return false;
    }
    return true;
  };

  const handleSubmitAnswers = async () => {
    if (!validateAnswers()) return;
    await handleSubmit(questions);
  };

  const handleGenerateNewLesson = async () => {
    if (!user) return;

    try {
      const result = await addToLearningPath(lessonId, subject);
      
      if (result && performance) {
        const newLesson = await handleGenerateLesson(
          subject,
          performance.correctPercentage < 70
        );

        if (newLesson && result.pathId) {
          const { data: lastLesson, error: orderError } = await supabase
            .from('learning_path_lessons')
            .select('order_index')
            .eq('path_id', result.pathId)
            .order('order_index', { ascending: false })
            .limit(1);

          if (orderError) throw orderError;

          const nextOrderIndex = (lastLesson?.[0]?.order_index ?? -1) + 1;

          await supabase
            .from('learning_path_lessons')
            .insert({
              path_id: result.pathId,
              lesson_id: newLesson.id,
              order_index: nextOrderIndex,
            });
        }
      }
    } catch (error) {
      console.error('Error generating new lesson:', error);
      toast.error('Failed to generate new lesson');
    }
  };

  if (!questions.length) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Practice Questions</h3>
      <div className="space-y-6">
        {questions.map((question, index) => (
          <QuestionComponent
            key={index}
            question={question}
            answerState={answers[index] || { answer: "", isSubmitted: false }}
            onAnswerChange={(answer) => handleAnswerChange(index, answer)}
            isLocked={isSubmitted}
          />
        ))}
        <QuestionActionButtons
          isSubmitted={isSubmitted}
          isSubmitting={isSubmitting}
          isGenerating={isGenerating}
          performance={performance}
          onSubmit={handleSubmitAnswers}
          onTryAgain={handleTryAgain}
          onGenerateNewLesson={handleGenerateNewLesson}
          onContinue={handleContinue}
        />
      </div>
    </div>
  );
};
