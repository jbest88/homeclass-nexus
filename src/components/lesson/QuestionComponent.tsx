import { MultipleChoiceQuestion } from "./question-types/MultipleChoiceQuestion";
import { MultipleAnswerQuestion } from "./question-types/MultipleAnswerQuestion";
import { TrueFalseQuestion } from "./question-types/TrueFalseQuestion";
import { DropdownQuestion } from "./question-types/DropdownQuestion";
import { TextQuestion } from "./question-types/TextQuestion";
import { Question, AnswerState } from "@/types/questions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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

  const isContextDependentQuestion = (questionText: string): boolean => {
    const contextPatterns = [
      /around you/i,
      /do you see/i,
      /can you see/i,
      /in your room/i,
      /in front of you/i,
      /near you/i,
      /beside you/i,
      /in your environment/i,
      /in your surroundings/i,
    ];
    return contextPatterns.some(pattern => pattern.test(questionText));
  };

  const getExplanation = () => {
    if (!answerState.isSubmitted) return '';
    
    // Handle context-dependent questions first
    if (isContextDependentQuestion(question.question)) {
      return `This question cannot be automatically validated as it depends on your physical surroundings. The correct answers would vary based on what you actually see around you.`;
    }

    // For questions with explanations from the validation service
    if (answerState.explanation) {
      return answerState.explanation;
    }

    // Default explanations if no specific explanation is provided
    if (answerState.isCorrect) {
      return 'Correct!';
    } else {
      return `Incorrect. The correct answer is "${question.answer}".`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="text-lg font-medium">{question.question}</div>
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
                <p className="text-gray-700 whitespace-pre-line">{getExplanation()}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionComponent;