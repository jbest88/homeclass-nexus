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

export const QuestionsSection = ({ questions, lessonId, subject }: QuestionsSectionProps) => {
  const navigate = useNavigate();
  const user = useUser();
  const { handleGenerateLesson, isGenerating } = useGenerateLesson();

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

  // Initialize answers with previous responses if they exist
  React.useEffect(() => {
    if (previousResponses && previousResponses.length > 0) {
      // Get the original question answers from the questions array
      const initialAnswers = questions.map((question, index) => {
        const response = previousResponses.find(r => r.question_index === index);
        let answer = "";
        
        // If this question was previously answered
        if (response) {
          // For multiple-answer questions, the answer should be an array
          if (question.type === 'multiple-answer' && Array.isArray(question.correctAnswers)) {
            answer = question.correctAnswers;
          } else {
            // For all other question types, use the correct answer from the question
            answer = question.answer;
          }
        }

        return {
          answer,
          isSubmitted: true,
          isCorrect: response?.is_correct || false,
        };
      });
      
      initializeAnswers(initialAnswers);
    }
  }, [previousResponses, questions, initializeAnswers]);

  if (!questions.length) return null;

  const handleContinue = () => {
    navigate("/dashboard");
  };

  const handleGenerateNewLesson = async () => {
    if (!user) return;

    try {
      // Create or get the latest learning path for this subject
      const { data: existingPaths, error: pathError } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', user.id)
        .eq('subject', subject)
        .order('created_at', { ascending: false })
        .limit(1);

      if (pathError) throw pathError;

      let pathId;
      
      if (!existingPaths?.length) {
        // Create new learning path
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
      } else {
        pathId = existingPaths[0].id;
      }

      // Check if the lesson is already in the path
      const { data: existingLesson, error: checkError } = await supabase
        .from('learning_path_lessons')
        .select('*')
        .eq('path_id', pathId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!existingLesson) {
        // Get the highest order_index for this path
        const { data: lastLesson, error: orderError } = await supabase
          .from('learning_path_lessons')
          .select('order_index')
          .eq('path_id', pathId)
          .order('order_index', { ascending: false })
          .limit(1);

        if (orderError) throw orderError;

        const nextOrderIndex = (lastLesson?.[0]?.order_index ?? -1) + 1;

        // Add current lesson to learning path if it's not already there
        const { error: lessonError } = await supabase
          .from('learning_path_lessons')
          .insert({
            path_id: pathId,
            lesson_id: lessonId,
            order_index: nextOrderIndex,
          });

        if (lessonError) throw lessonError;
      }

      if (performance && performance.correctPercentage < 70) {
        // If performance is below 70%, regenerate a lesson on the same subject
        const newLesson = await handleGenerateLesson(subject, true);
        if (newLesson) {
          // Get the latest order_index again
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
      } else {
        // If performance is good, move on to a new lesson
        const newLesson = await handleGenerateLesson(subject);
        if (newLesson) {
          // Get the latest order_index again
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
                : "Generate New Lesson"}
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