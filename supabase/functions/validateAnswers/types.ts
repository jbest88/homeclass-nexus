export interface ValidationRequest {
  question: string;
  userAnswer: string | string[];
  correctAnswer?: string;
  correctAnswers?: string[];
  type: 'text' | 'multiple-choice' | 'multiple-answer' | 'true-false' | 'dropdown';
}

export interface ValidationResult {
  isCorrect: boolean;
  explanation: string;
}