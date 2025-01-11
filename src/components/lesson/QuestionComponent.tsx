import { MultipleChoiceQuestion } from "./question-types/MultipleChoiceQuestion";
import { MultipleAnswerQuestion } from "./question-types/MultipleAnswerQuestion";
import { TrueFalseQuestion } from "./question-types/TrueFalseQuestion";
import { DropdownQuestion } from "./question-types/DropdownQuestion";
import { TextQuestion } from "./question-types/TextQuestion";
import { Question, AnswerState } from "@/types/questions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";

interface QuestionComponentProps {
  question: Question;
  answerState: AnswerState;
  onAnswerChange: (answer: string | string[]) => void;
  isLocked?: boolean;
  subject: string;
  lessonId: string;
  questionIndex: number;
}

export const QuestionComponent = ({
  question,
  answerState,
  onAnswerChange,
  isLocked = false,
  subject,
  lessonId,
  questionIndex,
}: QuestionComponentProps) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGettingHelp, setIsGettingHelp] = useState(false);
  const user = useUser();

  const { data: helpData, isLoading: isLoadingHelp } = useQuery({
    queryKey: ["question-help", lessonId, questionIndex],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      // First, try to get cached help from the database
      const { data: cachedHelp, error: fetchError } = await supabase
        .from("question_help")
        .select("explanation")
        .eq("lesson_id", lessonId)
        .eq("question_index", questionIndex)
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (cachedHelp) {
        return cachedHelp.explanation;
      }

      // If no cached help exists, get new help from the AI
      setIsGettingHelp(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-question-help', {
          body: { question: question.question, subject }
        });

        if (error) throw error;

        // Cache the help response
        const { error: insertError } = await supabase
          .from("question_help")
          .insert({
            lesson_id: lessonId,
            question_index: questionIndex,
            explanation: data.explanation,
            user_id: user.id,
          });

        if (insertError) throw insertError;

        return data.explanation;
      } finally {
        setIsGettingHelp(false);
      }
    },
    enabled: isHelpOpen && !!user, // Only fetch when dialog is opened and user is authenticated
  });

  const handleAnswerChange = (value: string | string[]) => {
    if (!isLocked) {
      onAnswerChange(value);
    }
  };

  const props = {
    question: question.question,
    value: answerState.answer,
    onChange: handleAnswerChange,
    disabled: isLocked,
    options: 'options' in question ? question.options : undefined,
  };

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'multiple-choice':
        return <MultipleChoiceQuestion {...props} />;
      case 'multiple-answer':
        return <MultipleAnswerQuestion {...props} />;
      case 'true-false':
        return <TrueFalseQuestion {...props} />;
      case 'dropdown':
        return <DropdownQuestion {...props} />;
      case 'text':
        return <TextQuestion {...props} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="relative">
          <div className="text-lg font-medium">{question.question}</div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={() => setIsHelpOpen(true)}
            disabled={isGettingHelp}
          >
            <HelpCircle className={isGettingHelp ? "animate-spin" : ""} />
          </Button>
        </CardHeader>
        <CardContent>
          {renderQuestionInput()}
          {answerState.isSubmitted && (
            <div className="mt-4">
              {answerState.isCorrect ? (
                <p className="text-green-600">Correct!</p>
              ) : (
                <p className="text-red-600">
                  Incorrect. {answerState.explanation}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI Tutor Help</DialogTitle>
          </DialogHeader>
          <div className="prose prose-slate dark:prose-invert max-w-none
            prose-headings:font-bold prose-headings:text-foreground
            prose-h1:text-3xl prose-h1:mb-8
            prose-h2:text-2xl prose-h2:mb-6
            prose-h3:text-xl prose-h3:mb-4
            prose-p:mb-4 prose-p:leading-7
            prose-li:my-2
            prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
            prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
            [&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-6">
            {isLoadingHelp ? (
              <div className="flex items-center justify-center py-8">
                <HelpCircle className="animate-spin h-8 w-8" />
              </div>
            ) : (
              helpData
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuestionComponent;