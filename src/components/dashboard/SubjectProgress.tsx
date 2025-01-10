import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface ModuleData {
  id: string;
  title: string;
  completed: boolean;
}

interface SubjectProgressProps {
  subject: string;
  totalModules: number;
  completedModules: number;
  modules: ModuleData[];
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
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  const handleDelete = async (lessonId: string) => {
    if (deletingLessonId) return;
    
    try {
      setDeletingLessonId(lessonId);
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
    } finally {
      setDeletingLessonId(null);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">{subject}</span>
        <span className="text-sm text-muted-foreground">
          {completedModules} / {totalModules} lessons
        </span>
      </div>
      <Progress
        value={(completedModules / totalModules) * 100}
        className="h-2"
      />
      <div className="mt-4 space-y-3">
        {modules.map((module) => (
          <div
            key={module.id}
            className="flex items-center justify-between bg-muted/50 p-3 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm">{module.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/generated-lesson/${module.id}`)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(module.id)}
                disabled={deletingLessonId === module.id}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectProgress;