import React from "react";
import { Button } from "@/components/ui/button";
import { QuestionComponent } from "./QuestionComponent";
import { useQuestionResponses } from "@/hooks/useQuestionResponses";
import { Question } from "@/types/questions";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface QuestionsSectionProps {
  questions: Question[];
  lessonId: string;
  subject: string;
}

export const QuestionsSection = ({ questions: initialQuestions, lessonId, subject }: QuestionsSectionProps) => {
  const navigate = useNavigate();
  const user = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState(initialQuestions);

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

  const getGradeLevelText = (gradeLevel: number | null) => {
    if (gradeLevel === null) return "Grade 5"; // Default fallback
    return gradeLevel === 0 ? "Kindergarten" : `Grade ${gradeLevel}`;
  };

  const handleGenerateNewQuestions = async () => {
    if (!user || !profile) return;
    
    try {
      setIsGenerating(true);
      
      const { data: proficiencyData } = await supabase
        .from("subject_proficiency")
        .select("proficiency_level")
        .eq("user_id", user.id)
        .eq("subject", subject)
        .single();

      const proficiencyLevel = proficiencyData?.proficiency_level || 1;
      const gradeLevelText = getGradeLevelText(profile.grade_level);

      const { data, error } = await supabase.functions.invoke("generateQuestions", {
        body: {
          lessonId,
          userId: user.id,
          gradeLevelText,
          difficultyLevel: proficiencyLevel,
          proficiencyLevel,
        },
      });

      if (error) throw error;

      setQuestions(data.questions);
      toast.success("New practice questions generated!");
      
    } catch (error) {
      console.error("Error generating new questions:", error);
      toast.error("Failed to generate new questions");
    } finally {
      setIsGenerating(false);
    }
  };

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
        {!isSubmitted ? (
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
              onClick={handleGenerateNewQuestions}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? "Generating..." : performance && performance.correctPercentage < 70 
                ? "Try More Questions" 
                : "Practice More"}
            </Button>
            <Button 
              onClick={() => navigate("/dashboard")}
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

export default QuestionsSection;