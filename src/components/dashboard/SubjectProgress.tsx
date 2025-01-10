import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  onGenerateLesson: (subject: string) => Promise<void>;
  isGenerating: boolean;
}

const SubjectProgress = ({
  subject,
  totalModules,
  completedModules,
  modules,
  onGenerateLesson,
  isGenerating,
}: SubjectProgressProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">{subject}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {completedModules} / {totalModules} modules
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onGenerateLesson(subject)}
            disabled={isGenerating}
          >
            <Plus className="h-4 w-4" />
            Generate
          </Button>
        </div>
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
              {module.completed && (
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              )}
              <span className="text-sm">{module.title}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/module/${module.id}`)}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectProgress;