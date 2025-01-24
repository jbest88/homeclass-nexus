import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGenerateLesson } from "@/hooks/useGenerateLesson";
import { getSubjectsForGrade } from "@/utils/gradeSubjects";
import { useSubscription } from "@/hooks/useSubscription";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProfileSettings from "@/components/profile/ProfileSettings";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CreateLessonDialog } from "@/components/dashboard/CreateLessonDialog";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isGenerating, handleGenerateLesson } = useGenerateLesson();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { subscription, isLoading: isSubscriptionLoading } = useSubscription();

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("profiles")
        .select("grade_level, birthday")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    setSelectedSubject("");
  }, [profile?.grade_level]);

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

  if (isProfileLoading || isSubscriptionLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <DashboardHeader
        subscription={subscription}
        isLoading={isSubscriptionLoading}
        onCreateLesson={() => setIsDialogOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
      />

      <CreateLessonDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        subjects={subjects}
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
        gradeLevel={profile?.grade_level ?? null}
      />

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
          </DialogHeader>
          <ProfileSettings onClose={() => setIsProfileOpen(false)} />
        </DialogContent>
      </Dialog>

      <DashboardContent
        isGenerating={isGenerating}
        upcomingAssignments={upcomingAssignments}
      />
    </div>
  );
};

export default Dashboard;