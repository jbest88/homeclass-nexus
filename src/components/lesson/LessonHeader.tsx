import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LessonHeaderProps {
  onDelete: () => void;
  isDeleting: boolean;
}

export const LessonHeader = ({ onDelete, isDeleting }: LessonHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      <Button
        variant="destructive"
        onClick={onDelete}
        disabled={isDeleting}
        className="flex items-center gap-2"
      >
        <Trash2 className="h-4 w-4" />
        {isDeleting ? "Deleting..." : "Delete Lesson"}
      </Button>
    </div>
  );
};