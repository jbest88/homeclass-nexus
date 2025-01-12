import { Button } from "@/components/ui/button";

interface QuestionActionButtonsProps {
  isSubmitted: boolean;
  isSubmitting: boolean;
  isGenerating: boolean;
  performance?: {
    correctPercentage: number;
  } | null;
  onTryAgain: () => void;
  onGenerateNewLesson: () => void;
  onContinue: () => void;
}

export const QuestionActionButtons = ({
  isSubmitted,
  isSubmitting,
  isGenerating,
  performance,
  onTryAgain,
  onGenerateNewLesson,
  onContinue,
}: QuestionActionButtonsProps) => {
  if (!isSubmitted) {
    return (
      <Button 
        onClick={onTryAgain}
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
        onClick={onTryAgain}
        variant="secondary"
        className="flex-1"
      >
        Try Again
      </Button>
      <Button 
        onClick={onGenerateNewLesson}
        disabled={isGenerating}
        className="flex-1"
      >
        {isGenerating ? "Generating..." : performance && performance.correctPercentage < 70 
          ? "Try a Different Approach" 
          : "Continue Learning"}
      </Button>
      <Button 
        onClick={onContinue}
        variant="outline"
        className="flex-1"
      >
        Return to Dashboard
      </Button>
    </div>
  );
};