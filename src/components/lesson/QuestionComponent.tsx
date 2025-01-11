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
import { toast } from "sonner";

interface QuestionComponentProps {
  question: Question;
  answerState: AnswerState;
  onAnswerChange: (answer: string | string[]) => void;
  isLocked?: boolean;
  subject: string;
  onHighlightContent: (text: string | null) => void;
}

export const QuestionComponent = ({
  question,
  answerState,
  onAnswerChange,
  isLocked = false,
  subject,
  onHighlightContent,
}: QuestionComponentProps) => {
  const [isGettingHelp, setIsGettingHelp] = useState(false);

  const handleAnswerChange = (value: string | string[]) => {
    if (!isLocked) {
      onAnswerChange(value);
    }
  };

  const getHelp = async () => {
    setIsGettingHelp(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-question-help', {
        body: { question: question.question, subject }
      });

      if (error) throw error;

      // Extract key terms from the question
      const keyTerms = question.question
        .toLowerCase()
        .replace(/[.,?!]/g, '')
        .split(' ')
        .filter(word => word.length > 4);

      // Highlight relevant content
      onHighlightContent(keyTerms[0]);

      toast.info("AI Tutor Help", {
        description: data.explanation,
        duration: 10000,
      });
    } catch (error) {
      console.error('Error getting help:', error);
      toast.error("Failed to get help. Please try again.");
    } finally {
      setIsGettingHelp(false);
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
    <Card>
      <CardHeader className="relative">
        <div className="text-lg font-medium">{question.question}</div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={getHelp}
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
  );
};

export default QuestionComponent;