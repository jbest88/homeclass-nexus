import { MultipleChoiceQuestion } from "./question-types/MultipleChoiceQuestion";
import { MultipleAnswerQuestion } from "./question-types/MultipleAnswerQuestion";
import { TrueFalseQuestion } from "./question-types/TrueFalseQuestion";
import { DropdownQuestion } from "./question-types/DropdownQuestion";
import { TextQuestion } from "./question-types/TextQuestion";
import { Question, AnswerState } from "@/types/questions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface QuestionComponentProps {
  question: Question;
  answerState: AnswerState;
  onAnswerChange: (answer: string | string[]) => void;
  isLocked?: boolean;
}

export const QuestionComponent = ({
  question,
  answerState,
  onAnswerChange,
  isLocked = false,
}: QuestionComponentProps) => {
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validatedQuestion, setValidatedQuestion] = useState<Question | null>(null);

  useEffect(() => {
    const validateQuestion = async () => {
      try {
        const response = await supabase.functions.invoke("validateWithAI", {
          body: {
            question: question.question,
            correctAnswer: question.answer,
            type: question.type,
            mode: "validate_question"
          },
        });

        if (response.error) throw response.error;

        const { isValid, explanation, suggestedCorrection } = response.data;

        if (!isValid) {
          console.error("Question validation failed:", explanation);
          setValidationError(explanation);
          toast.error("This question needs review by your teacher");
        } else {
          setValidatedQuestion(question);
        }
      } catch (error) {
        console.error("Error validating question:", error);
        // Fall back to using the original question if validation fails
        setValidatedQuestion(question);
      } finally {
        setIsValidating(false);
      }
    };

    validateQuestion();
  }, [question]);

  const handleAnswerChange = (value: string | string[]) => {
    if (!isLocked) {
      onAnswerChange(value);
    }
  };

  if (isValidating) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (validationError) {
    return (
      <Card>
        <CardHeader>
          <div className="text-red-600">Question Validation Error</div>
        </CardHeader>
        <CardContent>
          <p>{validationError}</p>
        </CardContent>
      </Card>
    );
  }

  if (!validatedQuestion) return null;

  const props = {
    question: validatedQuestion.question,
    value: answerState.answer,
    onChange: handleAnswerChange,
    disabled: isLocked,
    options: 'options' in validatedQuestion ? validatedQuestion.options : undefined,
  };

  const renderQuestionInput = () => {
    switch (validatedQuestion.type) {
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
      <CardHeader>
        <div className="text-lg font-medium">{validatedQuestion.question}</div>
      </CardHeader>
      <CardContent>
        {renderQuestionInput()}
        {answerState.isSubmitted && (
          <div className="mt-4 space-y-2">
            {answerState.isCorrect ? (
              <p className="text-green-600">Correct!</p>
            ) : (
              <div className="space-y-2">
                <p className="text-red-600">Incorrect</p>
                <p className="text-gray-700 whitespace-pre-line">
                  {answerState.explanation}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionComponent;