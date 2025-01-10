import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@supabase/auth-helpers-react";
import SubjectProgress from "./SubjectProgress";

interface LearningProgressProps {
  onGenerateLesson: (subject: string) => Promise<void>;
  isGenerating: boolean;
}

const LearningProgress = ({ onGenerateLesson, isGenerating }: LearningProgressProps) => {
  const user = useUser();

  const { data: modules } = useQuery({
    queryKey: ["learning-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_modules")
        .select("*")
        .order("subject")
        .order("order_index");

      if (error) throw error;
      return data;
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["module-progress"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("module_progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const subjectProgress = modules?.reduce((acc, module) => {
    if (!acc[module.subject]) {
      acc[module.subject] = {
        totalModules: 0,
        completedModules: 0,
        modules: [],
      };
    }

    acc[module.subject].totalModules++;
    acc[module.subject].modules.push({
      ...module,
      completed: progress?.some(
        (p) => p.module_id === module.id && p.completed_at
      ),
    });

    if (
      progress?.some((p) => p.module_id === module.id && p.completed_at)
    ) {
      acc[module.subject].completedModules++;
    }

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
              onGenerateLesson={onGenerateLesson}
              isGenerating={isGenerating}
            />
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LearningProgress;