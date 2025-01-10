import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import SubjectProgress from "./SubjectProgress";

interface LearningProgressProps {
  isGenerating: boolean;
}

const LearningProgress = ({ isGenerating }: LearningProgressProps) => {
  const user = useUser();
  const queryClient = useQueryClient();

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
  };

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
    });

    acc[lesson.subject].completedModules++;

    return acc;
  }, {} as Record<string, { totalModules: number; completedModules: number; modules: any[] }>);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {Object.entries(subjectProgress || {}).map(([subject, data]) => (
            <SubjectProgress
              key={subject}
              subject={subject}
              totalModules={data.totalModules}
              completedModules={data.completedModules}
              modules={data.modules}
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