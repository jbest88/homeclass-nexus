import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LearningPathItemProps {
  lessonId: string;
  title: string;
  createdAt: string;
  onDelete: (lessonId: string) => void;
  isGenerating: boolean;
}

export const LearningPathItem = ({
  lessonId,
  title,
  createdAt,
  onDelete,
  isGenerating,
}: LearningPathItemProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between rounded-lg border p-2 ml-4">
      <div className="flex-1">
        <div 
          className="cursor-pointer hover:text-primary"
          onClick={() => navigate(`/generated-lesson/${lessonId}`)}
        >
          {title}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {format(new Date(createdAt), 'MMM d, yyyy h:mm a')}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(lessonId)}
        disabled={isGenerating}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};