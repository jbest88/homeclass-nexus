import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

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
  isGenerating: boolean;
  onLessonDeleted: () => void;
}

const SubjectProgress = ({
  subject,
  totalModules,
  completedModules,
  modules,
  isGenerating,
  onLessonDeleted,
}: SubjectProgressProps) => {
  const navigate = useNavigate();

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

  // Function to clean title by removing markdown formatting
  const cleanTitle = (title: string) => {
    return title.replace(/[*#]/g, '').trim();
  };

  // Function to get curriculum period based on date
  const getCurriculumPeriod = (date: string) => {
    const lessonDate = new Date(date);
    const month = lessonDate.getMonth();
    
    // Academic periods based on typical school year
    if (month >= 8 && month <= 10) return "Fall Semester";
    if (month >= 11 || month <= 1) return "Winter Term";
    if (month >= 2 && month <= 4) return "Spring Semester";
    return "Summer Term";
  };

  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{subject}</h3>
        <span className="text-sm text-muted-foreground">
          {completedModules} / {totalModules} completed
        </span>
      </div>
      <Progress value={progressPercentage} className="mb-4" />
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