import React from "react";
import { Button } from "@/components/ui/button";
import { QuestionComponent } from "./QuestionComponent";
import { useQuestionResponses } from "@/hooks/useQuestionResponses";
import { Question } from "@/types/questions";
import { useNavigate } from "react-router-dom";
import { useGenerateLesson } from "@/hooks/useGenerateLesson";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";

interface QuestionsSectionProps {
  questions: Question[];
  lessonId: string;
  subject: string;
}

export const QuestionsSection = ({ questions: initialQuestions, lessonId, subject }: QuestionsSectionProps) => {
  const navigate = useNavigate();
  const user = useUser();
  const { handleGenerateLesson, isGenerating } = useGenerateLesson();
  const [questions, setQuestions] = React.useState(initialQuestions);

  // Fetch previous responses for this lesson
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

  const hasAnsweredBefore = previousResponses && previousResponses.length > 0;

  const {
    answers,
    isSubmitting,
    isSubmitted,
    handleAnswerChange,
    handleSubmit,
    performance,
    initializeAnswers,
  } = useQuestionResponses(lessonId, subject, hasAnsweredBefore);

  React.useEffect(() => {
    if (previousResponses && previousResponses.length > 0) {
      const initialAnswers = questions.map((question, index) => {
        const response = previousResponses.find(r => r.question_index === index);
        
        if (response) {
          return {
            answer: question.type === 'multiple-answer' ? 
              (question.correctAnswers || []) : 
              question.answer,
            isSubmitted: true,
            isCorrect: response?.is_correct || false,
          };
        }

        return {
          answer: question.type === 'multiple-answer' ? [] : "",
          isSubmitted: true,
          isCorrect: false,
        };
      });
      
      initializeAnswers(initialAnswers);
    }
  }, [previousResponses, questions, initializeAnswers]);

  const handleQuestionInvalid = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    navigate("/dashboard");
  };

  const handleGenerateNewLesson = async () => {
    if (!user) return;

    try {
      let pathId;
      let newLesson;

      // Check if this lesson is already part of a learning path
      const { data: existingPathLesson, error: checkError } = await supabase
        .from('learning_path_lessons')
        .select('path_id')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (checkError) throw checkError;

      // Get existing paths for this subject
      const { data: existingPaths, error: pathError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', user.id)
        .eq('subject', subject)
        .order('created_at', { ascending: false })
        .limit(1);

      if (pathError) throw pathError;

      // Create new path if none exists
      if (!existingPaths?.length) {
        const { data: newPath, error: createPathError } = await supabase
          .from('learning_paths')
          .insert({
            user_id: user.id,
            subject: subject,
          })
          .select()
          .single();

        if (createPathError) throw createPathError;
        pathId = newPath.id;

        // Add current lesson to the new path
        const { error: lessonError } = await supabase
          .from('learning_path_lessons')
          .insert({
            path_id: pathId,
            lesson_id: lessonId,
            order_index: 0,
          });

        if (lessonError) throw lessonError;
      } else {
        pathId = existingPathLesson?.path_id || existingPaths[0].id;

        // Add current lesson to existing path if not already added
        if (!existingPathLesson) {
          const { data: lastLesson, error: orderError } = await supabase
            .from('learning_path_lessons')
            .select('order_index')
            .eq('path_id', pathId)
            .order('order_index', { ascending: false })
            .limit(1);

          if (orderError) throw orderError;

          const nextOrderIndex = (lastLesson?.[0]?.order_index ?? -1) + 1;

          const { error: addLessonError } = await supabase
            .from('learning_path_lessons')
            .insert({
              path_id: pathId,
              lesson_id: lessonId,
              order_index: nextOrderIndex,
            });

          if (addLessonError) throw addLessonError;
        }
      }

      if (performance && pathId) {
        // Generate a new lesson with increased difficulty if performance is good
        newLesson = await handleGenerateLesson(
          subject,
          performance.correctPercentage < 70
        );

        if (newLesson) {
          // Get the latest order_index
          const { data: lastLesson, error: orderError } = await supabase
            .from('learning_path_lessons')
            .select('order_index')
            .eq('path_id', pathId)
            .order('order_index', { ascending: false })
            .limit(1);

          if (orderError) throw orderError;

          const nextOrderIndex = (lastLesson?.[0]?.order_index ?? -1) + 1;

          // Add new lesson to learning path
          await supabase
            .from('learning_path_lessons')
            .insert({
              path_id: pathId,
              lesson_id: newLesson.id,
              order_index: nextOrderIndex,
            });
        }
      }
    } catch (error) {
      console.error('Error managing learning path:', error);
      toast.error('Failed to update learning path');
    }
  };

  if (!questions.length) {
    return (
      <div className="mt-8 text-center">
        <h3 className="text-lg font-semibold mb-4">No Valid Questions Available</h3>
        <p className="text-gray-600 mb-4">All questions have been filtered out due to validation issues.</p>
        <Button onClick={handleContinue}>Return to Dashboard</Button>
      </div>
    );
  }

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
            isLocked={hasAnsweredBefore}
            onQuestionInvalid={() => handleQuestionInvalid(index)}
          />
        ))}
        {!hasAnsweredBefore && !isSubmitted ? (
          <Button 
            onClick={() => handleSubmit(questions)} 
            disabled={isSubmitting}
            className="mt-4"
          >
            {isSubmitting ? "Checking answers..." : "Submit Answers"}
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button 
              onClick={handleGenerateNewLesson}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? "Generating..." : performance && performance.correctPercentage < 70 
                ? "Try a Different Approach" 
                : "Continue Learning"}
            </Button>
            <Button 
              onClick={handleContinue}
              variant="outline"
              className="flex-1"
            >
              Return to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
