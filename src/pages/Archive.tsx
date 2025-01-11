import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import SubjectProgress from "@/components/dashboard/SubjectProgress";
import { LearningPath } from "@/types/learning-path";

const Archive = () => {
  const user = useUser();

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

  // Group archived lessons by subject and format them as learning paths
  const pathsBySubject = archivedLessons?.reduce((acc, lesson) => {
    const subject = lesson.generated_lessons.subject;
    if (!acc[subject]) {
      acc[subject] = {
        totalModules: 0,
        completedModules: 0,
        paths: [{
          id: subject,
          subject,
          created_at: new Date().toISOString(),
          lessons: []
        }] as LearningPath[]
      };
    }

    acc[subject].totalModules += 1;
    acc[subject].paths[0].lessons?.push({
      id: lesson.id,
      path_id: subject, // Add required path_id
      lesson_id: lesson.lesson_id,
      order_index: 0, // Add required order_index
      title: lesson.generated_lessons.title,
      created_at: lesson.archived_at,
    });

    return acc;
  }, {} as Record<string, { totalModules: number; completedModules: number; paths: LearningPath[] }>);

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
              {pathsBySubject && Object.entries(pathsBySubject).map(([subject, data]) => (
                <SubjectProgress
                  key={subject}
                  subject={subject}
                  totalModules={data.totalModules}
                  completedModules={data.completedModules}
                  modules={[]}
                  learningPaths={data.paths}
                  isGenerating={false}
                  onLessonDeleted={() => {}}
                />
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Archive;