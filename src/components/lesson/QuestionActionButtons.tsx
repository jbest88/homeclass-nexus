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
    <span className="inline-flex items-center gap-1">
      <span className="w-1 h-1 rounded-full bg-current animate-[bounce_0.7s_infinite] delay-0" />
      <span className="w-1 h-1 rounded-full bg-current animate-[bounce_0.7s_infinite] delay-[0.2s]" />
      <span className="w-1 h-1 rounded-full bg-current animate-[bounce_0.7s_infinite] delay-[0.4s]" />
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
          <span className="flex items-center gap-2">
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
          <span className="flex items-center gap-2">
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