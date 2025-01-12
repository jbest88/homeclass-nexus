import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface SectionNavigationProps {
  currentSection: number;
  totalSections: number;
  onNext: () => void;
  onPrevious: () => void;
  completedSections: number[];
}

export const SectionNavigation = ({
  currentSection,
  totalSections,
  onNext,
  onPrevious,
  completedSections,
}: SectionNavigationProps) => {
  const progress = ((completedSections.length) / totalSections) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentSection === 0}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Section {currentSection + 1} of {totalSections}
        </span>
        <Button
          onClick={onNext}
          disabled={currentSection === totalSections - 1}
        >
          Next
        </Button>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
};