import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";
import { LearningPath } from "@/types/learning-path";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const navigate = useNavigate();
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

  const progressPercentage = (completedModules / totalModules) * 100;

  // Function to clean title and add grade level
  const cleanTitle = (title: string) => {
    const baseTitle = title.replace(/[*#]/g, '').trim();
    const gradeLevel = profile?.grade_level;
    if (gradeLevel === null || gradeLevel === undefined) return baseTitle;
    return `${baseTitle} (Grade ${gradeLevel === 0 ? 'K' : gradeLevel})`;
  };

  // Function to get curriculum period based on date
  const getCurriculumPeriod = (date: string) => {
    const lessonDate = new Date(date);
    const month = lessonDate.getMonth();
    
    if (month >= 8 && month <= 10) return "Fall Semester";
    if (month >= 11 || month <= 1) return "Winter Term";
    if (month >= 2 && month <= 4) return "Spring Semester";
    return "Summer Term";
  };

  const togglePath = (pathId: string) => {
    setOpenPaths(prev => ({
      ...prev,
      [pathId]: !prev[pathId]
    }));
  };

  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{subject}</h3>
        <span className="text-sm text-muted-foreground">
          {totalModules > 0 ? `${Math.round((completedModules / totalModules) * 100)}%` : '0%'}
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
              <div
                key={lesson.id}
                className="flex items-center justify-between rounded-lg border p-2 ml-4"
              >
                <div className="flex-1">
                  <div 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => navigate(`/generated-lesson/${lesson.lesson_id}`)}
                  >
                    {cleanTitle(lesson.title)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">
                      {getCurriculumPeriod(lesson.created_at)}
                    </span> • {format(new Date(lesson.created_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(lesson.lesson_id)}
                  disabled={isGenerating}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}

      {/* Individual Lessons */}
      <div className="space-y-2">
        {modules.map((module) => (
          <div
            key={module.id}
            className="flex items-center justify-between rounded-lg border p-2"
          >
            <div className="flex-1">
              <div 
                className="cursor-pointer hover:text-primary"
                onClick={() => navigate(`/generated-lesson/${module.id}`)}
              >
                {cleanTitle(module.title)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">{getCurriculumPeriod(module.created_at)}</span> • {format(new Date(module.created_at), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(module.id)}
              disabled={isGenerating}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectProgress;