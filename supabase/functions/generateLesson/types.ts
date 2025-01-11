export interface LessonRequest {
  subject: string;
  userId: string;
  isRetry?: boolean;
}

export interface UserProfile {
  grade_level: number;
}

export interface Proficiency {
  proficiency_level: number;
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export interface Question {
  question: string;
  type: 'multiple-choice' | 'multiple-answer' | 'true-false' | 'dropdown' | 'text';
  options?: string[];
  answer?: string;
  correctAnswers?: string[];
}

export interface GeneratedLesson {
  title: string;
  content: string;
  questions: Question[];
}