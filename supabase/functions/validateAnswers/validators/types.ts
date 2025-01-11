import { ValidationResult } from '../types.ts';

export interface NumberValidationOptions {
  userAnswer: string;
  correctAnswer: string;
  question: string;
}

export interface MultipleAnswerValidationOptions {
  userAnswers: string[];
  correctAnswers: string[];
  question?: string;
}