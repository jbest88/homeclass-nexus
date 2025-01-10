import { TextQuestion } from "./question-types/TextQuestion";
import { MultipleChoiceQuestion } from "./question-types/MultipleChoiceQuestion";
import { MultipleAnswerQuestion } from "./question-types/MultipleAnswerQuestion";
import { TrueFalseQuestion } from "./question-types/TrueFalseQuestion";
import { SliderQuestion } from "./question-types/SliderQuestion";
import { DropdownQuestion } from "./question-types/DropdownQuestion";
import { Question, AnswerState } from "@/types/questions";

interface QuestionComponentProps {
  question: Question;
  index: number;
  answer: AnswerState | undefined;
  onAnswerChange: (index: number, value: string | string[]) => void;
  isLocked?: boolean;
}

export const QuestionComponent = ({
  question,
  index,
  answer,
  onAnswerChange,
  isLocked = false,
}: QuestionComponentProps) => {
  const handleAnswerChange = (value: string | string[]) => {
    if (isLocked) return;
    onAnswerChange(index, value);
  };

  const renderQuestionInput = () => {
    const props = {
      value: answer?.value || "",
      onChange: handleAnswerChange,
      disabled: isLocked,
      options: 'options' in question ? question.options : undefined,
      min: 'min' in question ? question.min : undefined,
      max: 'max' in question ? question.max : undefined,
      step: 'step' in question ? question.step : undefined,
    };

    switch (question.type) {
      case 'multiple-choice':
        return <MultipleChoiceQuestion {...props} />;
      case 'multiple-answer':
        return <MultipleAnswerQuestion {...props} />;
      case 'true-false':
        return <TrueFalseQuestion {...props} />;
      case 'slider':
        return <SliderQuestion {...props} />;
      case 'dropdown':
        return <DropdownQuestion {...props} />;
      default:
        return <TextQuestion {...props} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="font-medium mb-4">Q: {question.question}</p>
        {renderQuestionInput()}
        {answer?.isCorrect !== undefined && (
          <div className={`mt-2 p-2 rounded ${
            answer.isCorrect 
              ? "bg-green-100 text-green-800" 
              : "bg-red-100 text-red-800"
          }`}>
            <p className="font-medium">
              {answer.isCorrect ? "Correct!" : "Incorrect"}
            </p>
            {answer.explanation && (
              <p className="text-sm mt-1">{answer.explanation}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};