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
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { YouTubeConnect } from "@/components/dashboard/YouTubeConnect";
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
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ProfileSettings from "@/components/profile/ProfileSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import FeatureGate from "@/components/subscription/FeatureGate";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isGenerating, handleGenerateLesson } = useGenerateLesson();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isMobile = useIsMobile();
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">My Learning Dashboard</h1>
          <div className="flex items-center gap-2">
            <Badge variant={subscription?.tier === 'free' ? 'secondary' : 'default'}>
              {subscription?.tier.charAt(0).toUpperCase() + subscription?.tier.slice(1)} Plan
            </Badge>
            {!subscription?.is_active && (
              <Badge variant="destructive">Inactive</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                {!isMobile && "Create Lesson"}
                {isMobile && "Create"}
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
                  {profile?.grade_level !== null && (
                    <p className="text-sm text-muted-foreground">
                      Subjects shown are appropriate for {profile?.grade_level === 0 ? "Kindergarten" : `Grade ${profile?.grade_level}`}
                    </p>
                  )}
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
              <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                <Settings className="h-4 w-4" />
                {!isMobile && "My Profile"}
                {isMobile && "My Profile"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Profile Settings</DialogTitle>
              </DialogHeader>
              <ProfileSettings onClose={() => setIsProfileOpen(false)} />
            </DialogContent>
          </Dialog>

          <YouTubeConnect />

          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4" />
            {!isMobile && "Logout"}
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FeatureGate 
            featureCode="learning_paths"
            fallback={
              <Alert>
                <AlertDescription>
                  Learning paths are available with a subscription. Upgrade to access this feature!
                </AlertDescription>
              </Alert>
            }
          >
            <LearningProgress isGenerating={isGenerating} />
          </FeatureGate>
        </div>
        <div className="space-y-4">
          <FeatureGate 
            featureCode="progress_analytics"
            fallback={
              <Alert>
                <AlertDescription>
                  Detailed analytics are available with a Basic or higher subscription.
                </AlertDescription>
              </Alert>
            }
          >
            <StudyStats />
          </FeatureGate>
          <UpcomingAssignments assignments={upcomingAssignments} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
