import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { SectionNavigation } from "./SectionNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { toast } from "sonner";

interface LessonContentProps {
  title: string;
  subject: string;
  content: string;
  lessonId: string;
}

export const LessonContent = ({ title, subject, content, lessonId }: LessonContentProps) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const user = useUser();

  // Split content into sections based on h2 headers
  const sections = content.split(/(?=## )/g).filter(Boolean);
  const cleanTitle = title.replace(/[*#]/g, '').trim();

  useEffect(() => {
    const loadProgress = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('lesson_section_progress')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading progress:', error);
        return;
      }

      if (data) {
        setCurrentSection(data.current_section);
        setCompletedSections(data.completed_sections);
      }
    };

    loadProgress();
  }, [lessonId, user]);

  const saveProgress = async (section: number, completed: number[]) => {
    if (!user) return;

    const { error } = await supabase
      .from('lesson_section_progress')
      .upsert({
        user_id: user.id,
        lesson_id: lessonId,
        current_section: section,
        completed_sections: completed,
        last_accessed_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    }
  };

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
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{cleanTitle}</CardTitle>
        <div className="text-sm text-muted-foreground">
          Subject: {subject}
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-slate dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:text-foreground
          prose-h1:text-3xl prose-h1:mb-8
          prose-h2:text-2xl prose-h2:mb-6
          prose-h3:text-xl prose-h3:mb-4
          prose-p:mb-4 prose-p:leading-7
          prose-li:my-2
          prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
          prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
          [&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-6
          [&_.did-you-know]:bg-accent/10 [&_.did-you-know]:p-4 [&_.did-you-know]:rounded-lg [&_.did-you-know]:my-6
          [&_hr]:my-8 [&_hr]:border-muted">
          <ReactMarkdown
            components={{
              p: ({ node, ...props }) => {
                const content = String(props.children);
                if (content.startsWith('Did you know?')) {
                  return <div className="did-you-know" {...props} />;
                }
                return <p {...props} />;
              },
            }}
          >
            {sections[currentSection]}
          </ReactMarkdown>
        </div>
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