import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import LearningProgress from "@/components/dashboard/LearningProgress";
import StudyStats from "@/components/dashboard/StudyStats";
import UpcomingAssignments from "@/components/dashboard/UpcomingAssignments";

const Dashboard = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const user = useUser();
  const navigate = useNavigate();

  const { data: generatedLessons } = useQuery({
    queryKey: ["generated-lessons"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("generated_lessons")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleGenerateLesson = async (subject: string) => {
    try {
      setIsGenerating(true);
      
      // Get the next order index
      const maxOrderIndex = generatedLessons?.reduce((max, lesson) => 
        lesson.subject === subject ? Math.max(max, lesson.order_index) : max, -1
      ) ?? -1;
      
      const { data: lessonData, error: generateError } = await supabase.functions.invoke("generateLesson", {
        body: { subject },
      });

      if (generateError) throw generateError;

      const { data: insertData, error: insertError } = await supabase
        .from("generated_lessons")
        .insert({
          user_id: user?.id,
          subject,
          title: lessonData.title,
          content: lessonData.content,
          questions: lessonData.questions,
          order_index: maxOrderIndex + 1,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("New lesson generated successfully!");
      
      // Navigate to the new lesson
      navigate(`/generated-lesson/${insertData.id}`);
    } catch (error) {
      console.error("Error generating lesson:", error);
      toast.error("Failed to generate lesson");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error logging out');
    }
  };

  const upcomingAssignments = [
    { id: 1, title: "Math Quiz", due: "2024-03-20", subject: "Mathematics" },
    { id: 2, title: "Physics Lab Report", due: "2024-03-22", subject: "Physics" },
    { id: 3, title: "Chemistry Homework", due: "2024-03-25", subject: "Chemistry" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Learning Dashboard</h1>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <LearningProgress onGenerateLesson={handleGenerateLesson} isGenerating={isGenerating} />
        <StudyStats />
        <UpcomingAssignments assignments={upcomingAssignments} />
      </div>
    </div>
  );
};

export default Dashboard;