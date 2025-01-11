import { Json } from "./json";

export interface GeneratedLessonsTable {
  Row: {
    id: string;
    user_id: string;
    subject: string;
    title: string;
    content: string;
    questions: Json;
    order_index: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    subject: string;
    title: string;
    content: string;
    questions: Json;
    order_index: number;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    subject?: string;
    title?: string;
    content?: string;
    questions?: Json;
    order_index?: number;
    created_at?: string;
  };
  Relationships: [];
}

export interface LearningModulesTable {
  Row: {
    id: string;
    subject: string;
    title: string;
    content: string;
    order_index: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    subject: string;
    title: string;
    content: string;
    order_index: number;
    created_at?: string;
  };
  Update: {
    id?: string;
    subject?: string;
    title?: string;
    content?: string;
    order_index?: number;
    created_at?: string;
  };
  Relationships: [];
}

export interface ModuleProgressTable {
  Row: {
    id: string;
    user_id: string;
    module_id: string;
    completed_at: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    module_id: string;
    completed_at?: string | null;
    created_at: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    module_id?: string;
    completed_at?: string | null;
    created_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "module_progress_module_id_fkey";
      columns: ["module_id"];
      isOneToOne: false;
      referencedRelation: "learning_modules";
      referencedColumns: ["id"];
    }
  ];
}

export interface ProfilesTable {
  Row: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    updated_at: string | null;
    birthday: string | null;
    grade_level: number | null;
    country: string | null;
    state_province: string | null;
    city: string | null;
  };
  Insert: {
    id: string;
    username?: string | null;
    avatar_url?: string | null;
    updated_at?: string | null;
    birthday?: string | null;
    grade_level?: number | null;
    country?: string | null;
    state_province?: string | null;
    city?: string | null;
  };
  Update: {
    id?: string;
    username?: string | null;
    avatar_url?: string | null;
    updated_at?: string | null;
    birthday?: string | null;
    grade_level?: number | null;
    country?: string | null;
    state_province?: string | null;
    city?: string | null;
  };
  Relationships: [];
}

export interface QuestionHelpTable {
  Row: {
    id: string;
    user_id: string;
    lesson_id: string;
    question_index: number;
    explanation: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    lesson_id: string;
    question_index: number;
    explanation: string;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    lesson_id?: string;
    question_index?: number;
    explanation?: string;
    created_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "question_help_lesson_id_fkey";
      columns: ["lesson_id"];
      isOneToOne: false;
      referencedRelation: "generated_lessons";
      referencedColumns: ["id"];
    }
  ];
}

export interface QuestionResponsesTable {
  Row: {
    id: string;
    user_id: string;
    lesson_id: string;
    question_index: number;
    is_correct: boolean;
    response_time: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    lesson_id: string;
    question_index: number;
    is_correct: boolean;
    response_time: number;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    lesson_id?: string;
    question_index?: number;
    is_correct?: boolean;
    response_time?: number;
    created_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "question_responses_lesson_id_fkey";
      columns: ["lesson_id"];
      isOneToOne: false;
      referencedRelation: "generated_lessons";
      referencedColumns: ["id"];
    }
  ];
}

export interface SubjectProficiencyTable {
  Row: {
    id: string;
    user_id: string;
    subject: string;
    proficiency_level: number;
    total_questions_attempted: number;
    correct_answers: number;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    subject: string;
    proficiency_level?: number;
    total_questions_attempted?: number;
    correct_answers?: number;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    subject?: string;
    proficiency_level?: number;
    total_questions_attempted?: number;
    correct_answers?: number;
    updated_at?: string;
  };
  Relationships: [];
}