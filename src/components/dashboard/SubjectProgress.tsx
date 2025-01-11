import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { LearningPath } from "@/types/learning-path";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LearningPathItem } from "./LearningPathItem";
import { LessonItem } from "./LessonItem";

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
  const [openPaths, setOpenPaths] = useState<Record<string, boolean>>({});
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

  const togglePath = (pathId: string) => {
    setOpenPaths(prev => ({
      ...prev,
      [pathId]: !prev[pathId]
    }));
  };

  // Clean title and add grade level
  const cleanTitle = (title: string) => {
    const baseTitle = title.replace(/[*#]/g, '').trim();
    const gradeLevel = profile?.grade_level;
    if (gradeLevel === null || gradeLevel === undefined) return baseTitle;
    return `${baseTitle} (Grade ${gradeLevel === 0 ? 'K' : gradeLevel})`;
  };

  // Get curriculum period based on date
  const getCurriculumPeriod = (date: string) => {
    const lessonDate = new Date(date);
    const month = lessonDate.getMonth();
    
    if (month >= 8 && month <= 10) return "Fall Semester";
    if (month >= 11 || month <= 1) return "Winter Term";
    if (month >= 2 && month <= 4) return "Spring Semester";
    return "Summer Term";
  };

  const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{subject}</h3>
        <span className="text-sm text-muted-foreground">
          {Math.round(progressPercentage)}%
        </span>
      </div>
      <Progress value={progressPercentage} className="mb-4" />
      
      {/* Learning Paths */}
      {learningPaths.map((path) => (
        <Collapsible
          key={path.id}
          open={openPaths[path.id]}
          onOpenChange={() => togglePath(path.id)}
          className="mb-4"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-2 hover:bg-accent">
            <span className="font-medium">
              Learning Path - {format(new Date(path.created_at), 'MMM d, yyyy')}
            </span>
            {openPaths[path.id] ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {path.lessons?.map((lesson) => (
              <LearningPathItem
                key={lesson.id}
                lessonId={lesson.lesson_id}
                title={cleanTitle(lesson.title)}
                createdAt={lesson.created_at}
                onDelete={handleDelete}
                isGenerating={isGenerating}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}

      {/* Individual Lessons */}
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