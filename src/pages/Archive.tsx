import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ArchivedLesson {
  id: string;
  title: string;
  subject: string;
  created_at: string;
}

const Archive = () => {
  const user = useUser();
  const navigate = useNavigate();

  const { data: archivedLessons } = useQuery({
    queryKey: ["archived-lessons"],
    queryFn: async () => {
      if (!user) return null;

      const { data: archived, error } = await supabase
        .from("archived_lessons")
        .select(`
          id,
          lesson_id,
          archived_at,
          generated_lessons (
            id,
            title,
            subject,
            created_at
          )
        `)
        .eq("user_id", user.id)
        .order("archived_at", { ascending: false });

      if (error) throw error;

      return archived.map(item => ({
        id: item.lesson_id,
        title: item.generated_lessons.title,
        subject: item.generated_lessons.subject,
        created_at: item.generated_lessons.created_at
      })) as ArchivedLesson[];
    },
    enabled: !!user,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Archived Lessons</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {archivedLessons?.map(lesson => (
            <div key={lesson.id}>
              <h2>{lesson.title}</h2>
              <p>{lesson.subject}</p>
              <p>{new Date(lesson.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default Archive;
