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

  const getExplanation = () => {
    if (!answerState.isSubmitted || answerState.isCorrect) {
      return answerState.explanation;
    }

    if (question.type === 'multiple-answer' && 'correctAnswers' in question) {
      const userAnswers = (answerState.answer as string[]) || [];
      const correctAnswers = question.correctAnswers || [];
      
      const missed = correctAnswers.filter(answer => !userAnswers.includes(answer));
      const incorrect = userAnswers.filter(answer => !correctAnswers.includes(answer));
      
      let explanation = '';
      
      if (missed.length > 0) {
        explanation += `You missed these correct options: ${missed.join(', ')}. `;
      }
      
      if (incorrect.length > 0) {
        explanation += `You incorrectly selected: ${incorrect.join(', ')}. `;
      }
      
      explanation += `\n\nThe correct answers are: ${correctAnswers.join(', ')}. `;
      
      if (answerState.explanation) {
        explanation += `\n\n${answerState.explanation}`;
      }
      
      return explanation;
    }

    // For multiple choice questions, provide a clearer explanation
    if (question.type === 'multiple-choice') {
      return `The correct answer is "${question.answer}". ${answerState.explanation || ''}`;
    }

    return answerState.explanation;
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