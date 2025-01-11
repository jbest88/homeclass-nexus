import {
  GeneratedLessonsTable,
  LearningModulesTable,
  ModuleProgressTable,
  ProfilesTable,
  QuestionHelpTable,
  QuestionResponsesTable,
  SubjectProficiencyTable
} from "./tables";

export interface Database {
  public: {
    Tables: {
      generated_lessons: GeneratedLessonsTable;
      learning_modules: LearningModulesTable;
      module_progress: ModuleProgressTable;
      profiles: ProfilesTable;
      question_help: QuestionHelpTable;
      question_responses: QuestionResponsesTable;
      subject_proficiency: SubjectProficiencyTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];