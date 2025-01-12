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

  // Split content into sections based on h2 headers
  const sections = content.split(/(?=## )/g).filter(Boolean);

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
  
  return (
    <Card className="mb-8">
      <LessonHeader title={title} subject={subject} />
      <CardContent>
        <LessonSection content={sections[currentSection]} />
        <div className="mt-8">
          <SectionNavigation
            currentSection={currentSection}
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