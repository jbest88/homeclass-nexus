import { Button } from "@/components/ui/button";

interface QuestionActionButtonsProps {
  isSubmitted: boolean;
  isSubmitting: boolean;
  isGenerating: boolean;
  performance?: {
    correctPercentage: number;
  } | null;
  onSubmit: () => void;
  onTryAgain: () => void;
  onGenerateNewLesson: () => void;
  onContinue: () => void;
}

export const QuestionActionButtons = ({
  isSubmitted,
  isSubmitting,
  isGenerating,
  performance,
  onSubmit,
  onTryAgain,
  onGenerateNewLesson,
  onContinue,
}: QuestionActionButtonsProps) => {
  const LoadingDots = () => (
    <span className="inline-flex gap-1">
      <span className="animate-bounce delay-0">.</span>
      <span className="animate-bounce delay-100">.</span>
      <span className="animate-bounce delay-200">.</span>
    </span>
  );

  if (!isSubmitted) {
    return (
      <Button 
        onClick={onSubmit}
        disabled={isSubmitting}
        className="mt-4"
      >
        {isSubmitting ? (
          <span className="flex items-center">
            Checking answers<LoadingDots />
          </span>
        ) : (
          "Submit Answers"
        )}
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
        {isGenerating ? (
          <span className="flex items-center">
            Generating<LoadingDots />
          </span>
        ) : (
          performance && performance.correctPercentage < 70 
            ? "Try a Different Approach" 
            : "Continue Learning"
        )}
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