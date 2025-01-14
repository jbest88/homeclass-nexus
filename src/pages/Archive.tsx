import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import SubjectProgress from "@/components/dashboard/SubjectProgress";
import { LearningPath } from "@/types/learning-path";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format, parseISO } from "date-fns";

const Archive = () => {
  const user = useUser();

  const { data: archivedLessons } = useQuery({
    queryKey: ["archived-lessons"],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: lessonResponses } = await supabase
        .from('question_responses')
        .select('lesson_id')
        .eq('user_id', user.id);

      const lessonIds = lessonResponses?.map(response => response.lesson_id) || [];
      
      const { data, error } = await supabase
        .from("archived_lessons")
        .select(`
          id,
          archived_at,
          lesson_id,
          generated_lessons (
            id,
            title,
            subject,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds)
        .order("archived_at", { ascending: false });

      if (error) throw error;
      return data.map(lesson => ({
        id: lesson.id,
        archived_at: lesson.archived_at,
        lesson_id: lesson.lesson_id,
        title: lesson.generated_lessons.title,
        subject: lesson.generated_lessons.subject,
        created_at: lesson.generated_lessons.created_at
      }));
    },
    enabled: !!user,
  });

  // Group archived lessons by date first, then by subject
  const lessonsByDate = archivedLessons?.reduce((acc, lesson) => {
    const date = format(parseISO(lesson.archived_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = {};
    }
    
    const subject = lesson.subject;
    if (!acc[date][subject]) {
      acc[date][subject] = {
        totalModules: 0,
        completedModules: 0,
        paths: [{
          id: `${date}-${subject}`,
          subject,
          created_at: lesson.archived_at,
          lessons: []
        }] as LearningPath[]
      };
    }

    acc[date][subject].totalModules += 1;
    acc[date][subject].paths[0].lessons?.push({
      id: lesson.id,
      path_id: `${date}-${subject}`,
      lesson_id: lesson.lesson_id,
      order_index: 0,
      title: lesson.title,
      created_at: lesson.archived_at,
    });

    return acc;
  }, {} as Record<string, Record<string, { totalModules: number; completedModules: number; paths: LearningPath[] }>>);

  const hasArchivedLessons = archivedLessons && archivedLessons.length > 0;

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Other Journeys
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasArchivedLessons ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">Your previous learning journeys will appear here.</p>
              <p>Completed lessons that are more than 24 hours old are automatically moved to this space, 
                 allowing you to track your learning progress over time.</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <Accordion type="single" collapsible className="space-y-4">
                {lessonsByDate && Object.entries(lessonsByDate).map(([date, subjectData]) => (
                  <AccordionItem key={date} value={date} className="border rounded-lg px-4">
                    <AccordionTrigger className="py-4">
                      <span className="text-lg font-semibold">
                        {format(parseISO(date), 'MMMM d, yyyy')}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6 py-4">
                        {Object.entries(subjectData).map(([subject, data]) => (
                          <SubjectProgress
                            key={`${date}-${subject}`}
                            subject={subject}
                            totalModules={data.totalModules}
                            completedModules={data.completedModules}
                            modules={[]}
                            learningPaths={data.paths}
                            isGenerating={false}
                            onLessonDeleted={() => {}}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Archive;
