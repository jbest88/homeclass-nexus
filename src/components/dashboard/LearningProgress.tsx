import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import SubjectProgress from "./SubjectProgress";
import { LearningPath } from "@/types/learning-path";

interface LearningProgressProps {
  isGenerating: boolean;
}

const LearningProgress = ({ isGenerating }: LearningProgressProps) => {
  const user = useUser();
  const queryClient = useQueryClient();

  const { data: learningPaths } = useQuery({
    queryKey: ["learning-paths"],
    queryFn: async () => {
      if (!user) return null;
      
      // Fetch learning paths
      const { data: paths, error: pathsError } = await supabase
        .from("learning_paths")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (pathsError) throw pathsError;

      // For each path, fetch its lessons
      const pathsWithLessons = await Promise.all(
        paths.map(async (path) => {
          const { data: pathLessons, error: lessonsError } = await supabase
            .from("learning_path_lessons")
            .select(`
              id,
              path_id,
              lesson_id,
              order_index,
              created_at,
              generated_lessons (
                id,
                title,
                subject,
                created_at
              )
            `)
            .eq("path_id", path.id)
            .order("order_index");

          if (lessonsError) throw lessonsError;

          return {
            ...path,
            lessons: pathLessons.map(pl => ({
              ...pl,
              title: pl.generated_lessons.title,
              subject: pl.generated_lessons.subject,
            })),
          };
        })
      );

      return pathsWithLessons;
    },
    enabled: !!user,
  });

  const { data: generatedLessons } = useQuery({
    queryKey: ["generated-lessons"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("generated_lessons")
        .select("*")
        .eq("user_id", user.id)
        .order("subject")
        .order("order_index");

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleLessonDeleted = () => {
    queryClient.invalidateQueries({ queryKey: ["generated-lessons"] });
    queryClient.invalidateQueries({ queryKey: ["learning-paths"] });
  };

  // Group lessons by subject for regular progress view
  const subjectProgress = generatedLessons?.reduce((acc, lesson) => {
    if (!acc[lesson.subject]) {
      acc[lesson.subject] = {
        totalModules: 0,
        completedModules: 0,
        modules: [],
      };
    }

    acc[lesson.subject].totalModules++;
    acc[lesson.subject].modules.push({
      id: lesson.id,
      title: lesson.title,
      completed: true,
      created_at: lesson.created_at,
    });

    acc[lesson.subject].completedModules++;

    return acc;
  }, {} as Record<string, { totalModules: number; completedModules: number; modules: any[] }>);

  // Group learning paths by subject
  const pathsBySubject = learningPaths?.reduce((acc, path) => {
    if (!acc[path.subject]) {
      acc[path.subject] = [];
    }
    acc[path.subject].push(path);
    return acc;
  }, {} as Record<string, LearningPath[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {Object.entries(subjectProgress || {}).map(([subject, data]) => (
            <SubjectProgress
              key={subject}
              subject={subject}
              totalModules={data.totalModules}
              completedModules={data.completedModules}
              modules={data.modules}
              learningPaths={pathsBySubject?.[subject] || []}
              isGenerating={isGenerating}
              onLessonDeleted={handleLessonDeleted}
            />
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LearningProgress;