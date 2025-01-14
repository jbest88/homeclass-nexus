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
    let baseTitle = title.replace(/\s*\([^)]*\)/g, '');
    baseTitle = baseTitle.replace(/^(Grade|K|Kindergarten)\s*\d*\s*:?\s*/i, '');
    baseTitle = baseTitle.replace(/[*#]/g, '').trim();
    
    const gradeLevel = profile?.grade_level;
    if (gradeLevel === null || gradeLevel === undefined) return baseTitle;
    
    return `${baseTitle} (Grade ${gradeLevel === 0 ? 'K' : gradeLevel})`;
  };

  const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  // Group standalone modules into a "Today's Lessons" section if they're not part of a learning path
  const standaloneModules = modules.filter(module => {
    // Check if this module is not part of any learning path
    return !learningPaths.some(path => 
      path.lessons?.some(lesson => lesson.lesson_id === module.id)
    );
  });

  return (
    <div className="mb-6 last:mb-0">
      <SubjectProgressHeader 
        subject={subject} 
        progressPercentage={progressPercentage} 
      />
      
      {/* Display learning paths first */}
      <LearningPathsList
        learningPaths={learningPaths}
        onDelete={handleDelete}
        isGenerating={isGenerating}
        cleanTitle={cleanTitle}
      />

      {/* Display standalone modules in their own section if any exist */}
      {standaloneModules.length > 0 && (
        <div className="mt-4">
          <div className="mb-2">
            <h4 className="text-sm font-medium">Individual Lessons</h4>
          </div>
          <div className="space-y-2">
            {standaloneModules.map((module) => (
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
      )}
    </div>
  );
};

export default SubjectProgress;