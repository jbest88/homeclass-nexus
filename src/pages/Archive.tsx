import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { format } from "date-fns";
import SubjectProgress from "@/components/dashboard/SubjectProgress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Archive as ArchiveIcon } from "lucide-react";

interface ArchivedLesson {
  id: string;
  archived_at: string;
  lesson_id: string;
  title: string;
  subject: string;
  created_at: string;
}

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
        .eq("user_id", user.id)
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
      })) as ArchivedLesson[];
    },
    enabled: !!user,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArchiveIcon className="h-5 w-5" />
          Archived Lessons
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {archivedLessons?.map(lesson => (
            <SubjectProgress
              key={lesson.id}
              subject={lesson.subject}
              totalModules={1}
              completedModules={1}
              modules={[{
                id: lesson.lesson_id,
                title: lesson.title,
                completed: true,
                created_at: lesson.created_at,
              }]}
              learningPaths={[]}
              isGenerating={false}
              onLessonDeleted={() => {}}
            />
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default Archive;
