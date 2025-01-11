import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LessonItemProps {
  id: string;
  title: string;
  createdAt: string;
  curriculumPeriod: string;
  onDelete: (id: string) => void;
  isGenerating: boolean;
}

export const LessonItem = ({
  id,
  title,
  createdAt,
  curriculumPeriod,
  onDelete,
  isGenerating,
}: LessonItemProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between rounded-lg border p-2">
      <div className="flex-1">
        <div 
          className="cursor-pointer hover:text-primary"
          onClick={() => navigate(`/generated-lesson/${id}`)}
        >
          {title}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          <span className="font-medium">{curriculumPeriod}</span> • {format(new Date(createdAt), 'MMM d, yyyy h:mm a')}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(id)}
        disabled={isGenerating}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};