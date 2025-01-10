import { Button } from "@/components/ui/button";
import { LogOut, Plus, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import LearningProgress from "@/components/dashboard/LearningProgress";
import StudyStats from "@/components/dashboard/StudyStats";
import UpcomingAssignments from "@/components/dashboard/UpcomingAssignments";
import { useGenerateLesson } from "@/hooks/useGenerateLesson";
import { getSubjectsForGrade } from "@/utils/gradeSubjects";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ProfileSettings from "@/components/profile/ProfileSettings";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isGenerating, handleGenerateLesson } = useGenerateLesson();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Fetch user's grade level from profile
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("profiles")
        .select("grade_level")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const subjects = getSubjectsForGrade(profile?.grade_level);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error logging out');
    }
  };

  const handleGenerate = async () => {
    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }
    await handleGenerateLesson(selectedSubject);
    setIsDialogOpen(false);
    setSelectedSubject("");
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
        <div className="flex items-center gap-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Generate Lesson
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate New Lesson</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedSubject}
                  className="w-full"
                >
                  {isGenerating ? "Generating..." : "Generate"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Profile Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Profile Settings</DialogTitle>
              </DialogHeader>
              <ProfileSettings />
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <LearningProgress isGenerating={isGenerating} />
        <StudyStats />
        <UpcomingAssignments assignments={upcomingAssignments} />
      </div>
    </div>
  );
};

export default Dashboard;