export type BaseQuestion = {
  question: string;
  answer: string;
  type: 'text' | 'multiple-choice' | 'multiple-answer' | 'true-false' | 'dropdown';
};

export type TextQuestion = BaseQuestion & {
  type: 'text';
};

export type MultipleChoiceQuestion = BaseQuestion & {
  type: 'multiple-choice';
  options: string[];
};

export type MultipleAnswerQuestion = BaseQuestion & {
  type: 'multiple-answer';
  options: string[];
};

export type TrueFalseQuestion = BaseQuestion & {
  type: 'true-false';
};

export type DropdownQuestion = BaseQuestion & {
  type: 'dropdown';
  options: string[];
};

export type Question = 
  | TextQuestion 
  | MultipleChoiceQuestion 
  | MultipleAnswerQuestion 
  | TrueFalseQuestion 
  | DropdownQuestion;

export interface QuestionInputProps {
  question: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
  options?: string[];
}

export type AnswerState = {
  answer: string | string[];
  isCorrect?: boolean;
  isSubmitted: boolean;
};