export type BaseQuestion = {
  question: string;
  answer: string;
  type: 'text' | 'multiple-choice' | 'multiple-answer' | 'true-false' | 'slider' | 'dropdown';
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
  correctAnswers: string[];
};

export type TrueFalseQuestion = BaseQuestion & {
  type: 'true-false';
};

export type SliderQuestion = BaseQuestion & {
  type: 'slider';
  min: number;
  max: number;
  step: number;
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
  | SliderQuestion 
  | DropdownQuestion;

export interface QuestionInputProps {
  options?: string[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export type AnswerState = {
  value: string | string[];
  isCorrect?: boolean;
  explanation?: string;
  startTime?: number;
};