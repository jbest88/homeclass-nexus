import { MultipleChoiceQuestion } from "./question-types/MultipleChoiceQuestion";
import { MultipleAnswerQuestion } from "./question-types/MultipleAnswerQuestion";
import { TrueFalseQuestion } from "./question-types/TrueFalseQuestion";
import { DropdownQuestion } from "./question-types/DropdownQuestion";
import { TextQuestion } from "./question-types/TextQuestion";
import { Question, AnswerState } from "@/types/questions";

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

export default QuestionComponent;