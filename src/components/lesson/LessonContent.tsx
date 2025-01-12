import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { LessonHeader } from "./content/LessonHeader";
import { LessonSection } from "./content/LessonSection";
import { SectionNavigation } from "./SectionNavigation";
import { useLessonProgress } from "./content/useLessonProgress";

interface LessonContentProps {
  title: string;
  subject: string;
  content: string;
  lessonId: string;
}

export const LessonContent = ({ title, subject, content, lessonId }: LessonContentProps) => {
  const {
    currentSection,
    setCurrentSection,
    completedSections,
    setCompletedSections,
    saveProgress,
  } = useLessonProgress(lessonId);

  // Split content into sections based on h2 headers and clean up
  const sections = content
    .split(/(?=## )/g)
    .filter(section => section.trim().length > 0)
    .map(section => section.trim());

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      const newSection = currentSection + 1;
      setCurrentSection(newSection);
      
      if (!completedSections.includes(currentSection)) {
        const newCompleted = [...completedSections, currentSection];
        setCompletedSections(newCompleted);
        saveProgress(newSection, newCompleted);
      } else {
        saveProgress(newSection, completedSections);
      }
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      const newSection = currentSection - 1;
      setCurrentSection(newSection);
      saveProgress(newSection, completedSections);
    }
  };

  // Ensure we have a valid current section
  const validCurrentSection = Math.min(currentSection, sections.length - 1);
  
  return (
    <Card className="mb-8">
      <LessonHeader title={title} subject={subject} />
      <CardContent className="py-6">
        <div className="min-h-[300px] max-h-[60vh] overflow-y-auto px-4">
          {sections[validCurrentSection] && (
            <LessonSection content={sections[validCurrentSection]} />
          )}
        </div>
        <div className="mt-8">
          <SectionNavigation
            currentSection={validCurrentSection}
            totalSections={sections.length}
            onNext={handleNext}
            onPrevious={handlePrevious}
            completedSections={completedSections}
          />
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {format(new Date(), 'MMM d, yyyy h:mm a')}
      </CardFooter>
    </Card>
  );
};