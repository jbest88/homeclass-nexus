import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface QuestionActionsProps {
  isSubmitted: boolean;
  isSubmitting: boolean;
  isGenerating: boolean;
  performance: { correctPercentage: number } | null;
  onSubmit: () => void;
  onGenerateNew: () => void;
}

export const QuestionActions = ({
  isSubmitted,
  isSubmitting,
  isGenerating,
  performance,
  onSubmit,
  onGenerateNew,
}: QuestionActionsProps) => {
  const navigate = useNavigate();

  if (!isSubmitted) {
    return (
      <Button 
        onClick={onSubmit} 
        disabled={isSubmitting}
        className="mt-4"
      >
        {isSubmitting ? "Checking answers..." : "Submit Answers"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-4">
      <Button 
        onClick={onGenerateNew}
        disabled={isGenerating}
        className="flex-1"
      >
        {isGenerating ? "Generating..." : performance && performance.correctPercentage < 70 
          ? "Try More Questions" 
          : "Practice More"}
      </Button>
      <Button 
        onClick={() => navigate("/dashboard")}
        variant="outline"
        className="flex-1"
      >
        Return to Dashboard
      </Button>
    </div>
  );
};