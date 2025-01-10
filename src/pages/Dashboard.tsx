import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import LearningProgress from "@/components/dashboard/LearningProgress";
import StudyStats from "@/components/dashboard/StudyStats";
import UpcomingAssignments from "@/components/dashboard/UpcomingAssignments";
import { useGenerateLesson } from "@/hooks/useGenerateLesson";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isGenerating, handleGenerateLesson } = useGenerateLesson();

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
        <LearningProgress 
          onGenerateLesson={handleGenerateLesson} 
          isGenerating={isGenerating} 
        />
        <StudyStats />
        <UpcomingAssignments assignments={upcomingAssignments} />
      </div>
    </div>
  );
};

export default Dashboard;