import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUser } from "@supabase/auth-helpers-react";

const ProfileSettings = () => {
  const user = useUser();
  const [birthday, setBirthday] = useState<Date>();
  const [gradeLevel, setGradeLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Fetch or create profile on component mount
  useEffect(() => {
    const fetchOrCreateProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Try to fetch existing profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("birthday, grade_level")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        // If no profile exists, create one
        if (!profile) {
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({ id: user.id });

          if (insertError) throw insertError;
          
          // Profile created, but no birthday/grade_level yet
          setGradeLevel(null);
          setBirthday(undefined);
          return;
        }

        // Profile exists, set the data
        if (profile.birthday) {
          setBirthday(new Date(profile.birthday));
        }
        if (profile.grade_level !== null) {
          setGradeLevel(profile.grade_level);
        }
      } catch (error) {
        console.error("Error fetching/creating profile:", error);
        toast.error("Failed to load profile settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrCreateProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || !birthday) {
      toast.error("Please select a birthday");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          birthday: birthday.toISOString().split('T')[0],
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return <div>Loading profile settings...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Birthday</label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !birthday && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {birthday ? format(birthday, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={birthday}
              onSelect={(date) => {
                setBirthday(date);
                setIsCalendarOpen(false);
              }}
              initialFocus
              fromYear={1990}
              toYear={new Date().getFullYear()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {gradeLevel !== null && (
        <div>
          <label className="block text-sm font-medium mb-1">Current Grade Level</label>
          <div className="text-lg font-semibold">
            {gradeLevel === 0 ? "Kindergarten" : `Grade ${gradeLevel}`}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Grade level is automatically calculated based on your birthday
          </p>
        </div>
      )}

      <Button onClick={handleSave} className="mt-4">
        Save Changes
      </Button>
    </div>
  );
};

export default ProfileSettings;