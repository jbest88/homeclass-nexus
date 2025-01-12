import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LearningPath } from "@/types/learning-path";
import { LessonItem } from "./LessonItem";
import { getCurriculumPeriod } from "@/utils/curriculumPeriod";
import SubjectProgressHeader from "./SubjectProgressHeader";
import LearningPathsList from "./LearningPathsList";

interface SubjectProgressProps {
  subject: string;
  totalModules: number;
  completedModules: number;
  modules: Array<{
    id: string;
    title: string;
    completed: boolean;
    created_at: string;
  }>;
  learningPaths: LearningPath[];
  isGenerating: boolean;
  onLessonDeleted: () => void;
}

const SubjectProgress = ({
  subject,
  totalModules,
  completedModules,
  modules,
  learningPaths,
  isGenerating,
  onLessonDeleted,
}: SubjectProgressProps) => {
  const user = useUser();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("grade_level")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleDelete = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from("generated_lessons")
        .delete()
        .eq("id", lessonId);

      if (error) throw error;

      toast.success("Lesson deleted successfully");
      onLessonDeleted();
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast.error("Failed to delete lesson");
    }
  };

  const cleanTitle = (title: string) => {
    // Remove any existing grade information in parentheses
    let baseTitle = title.replace(/\s*\([^)]*\)/g, '');
    // Remove any grade information from the beginning of the title
    baseTitle = baseTitle.replace(/^(Grade|K|Kindergarten)\s*\d*\s*:?\s*/i, '');
    // Remove special characters
    baseTitle = baseTitle.replace(/[*#]/g, '').trim();
    
    const gradeLevel = profile?.grade_level;
    if (gradeLevel === null || gradeLevel === undefined) return baseTitle;
    
    // Add the grade level in a consistent format
    return `${baseTitle} (Grade ${gradeLevel === 0 ? 'K' : gradeLevel})`;
  };

  const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  return (
    <div className="mb-6 last:mb-0">
      <SubjectProgressHeader 
        subject={subject} 
        progressPercentage={progressPercentage} 
      />
      
      <LearningPathsList
        learningPaths={learningPaths}
        onDelete={handleDelete}
        isGenerating={isGenerating}
        cleanTitle={cleanTitle}
      />

      <div className="space-y-2">
        {modules.map((module) => (
          <LessonItem
            key={module.id}
            id={module.id}
            title={cleanTitle(module.title)}
            createdAt={module.created_at}
            curriculumPeriod={getCurriculumPeriod(module.created_at)}
            onDelete={handleDelete}
            isGenerating={isGenerating}
          />
        ))}
      </div>
    </div>
  );
};

export default SubjectProgress;