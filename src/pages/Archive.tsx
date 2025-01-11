import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const Archive = () => {
  const user = useUser();
  const navigate = useNavigate();

  const { data: archivedLessons } = useQuery({
    queryKey: ["archived-lessons"],
    queryFn: async () => {
      if (!user) return null;
      
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
        .order("archived_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const groupedLessons = archivedLessons?.reduce((acc, lesson) => {
    const subject = lesson.generated_lessons.subject;
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(lesson);
    return acc;
  }, {} as Record<string, typeof archivedLessons>);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Archived Lessons</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Archive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {groupedLessons && Object.entries(groupedLessons).map(([subject, lessons]) => (
              <div key={subject} className="mb-6 last:mb-0">
                <h3 className="text-lg font-semibold mb-3">{subject}</h3>
                <div className="space-y-2">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <div 
                          className="cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/generated-lesson/${lesson.lesson_id}`)}
                        >
                          {lesson.generated_lessons.title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Archived on {format(new Date(lesson.archived_at), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default Archive;