import React, { useState } from "react";
import { QuestionComponent } from "./QuestionComponent";
import { QuestionActions } from "./QuestionActions";
import { useQuestionResponses } from "@/hooks/useQuestionResponses";
import { useQuestionGeneration } from "@/hooks/useQuestionGeneration";
import { Question } from "@/types/questions";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface QuestionsSectionProps {
  questions: Question[];
  lessonId: string;
  subject: string;
}

export const QuestionsSection = ({ 
  questions: initialQuestions, 
  lessonId, 
  subject 
}: QuestionsSectionProps) => {
  const user = useUser();
  const [questions, setQuestions] = useState(initialQuestions);
  const { isGenerating, generateNewQuestions } = useQuestionGeneration(lessonId, subject);

  // Fetch user profile for grade level
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("grade_level")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const {
    answers,
    isSubmitting,
    isSubmitted,
    handleAnswerChange,
    handleSubmit,
    performance,
    initializeAnswers,
  } = useQuestionResponses(lessonId, subject);

  React.useEffect(() => {
    if (questions) {
      initializeAnswers(questions.map(() => ({
        answer: "",
        isSubmitted: false,
      })));
    }
  }, [questions, initializeAnswers]);

  const handleGenerateNewQuestions = async () => {
    const newQuestions = await generateNewQuestions(user?.id, profile);
    if (newQuestions) {
      setQuestions(newQuestions);
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
          />
        ))}
        <QuestionActions
          isSubmitted={isSubmitted}
          isSubmitting={isSubmitting}
          isGenerating={isGenerating}
          performance={performance}
          onSubmit={() => handleSubmit(questions)}
          onGenerateNew={handleGenerateNewQuestions}
        />
      </div>
    </div>
  );
};

export default QuestionsSection;