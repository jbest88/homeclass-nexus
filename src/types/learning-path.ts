export interface LearningPath {
  id: string;
  user_id: string;
  subject: string;
  created_at: string;
  lessons?: LearningPathLesson[];
}

export interface LearningPathLesson {
  id: string;
  path_id: string;
  lesson_id: string;
  order_index: number;
  created_at: string;
  title?: string;
  subject?: string;
  generated_lessons?: {
    id: string;
    title: string;
    subject: string;
    created_at: string;
  };
}