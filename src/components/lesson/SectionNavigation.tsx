import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Section {currentSection + 1} of {totalSections}
        </span>
        <Button
          onClick={onNext}
          disabled={currentSection === totalSections - 1}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>
    </div>
  );
};