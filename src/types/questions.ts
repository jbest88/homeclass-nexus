export type BaseQuestion = {
  question: string;
  answer: string;
  type: 'text' | 'multiple-choice' | 'multiple-answer';
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

export type Question = TextQuestion | MultipleChoiceQuestion | MultipleAnswerQuestion;