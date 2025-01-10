import { useState } from "react";
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

  // Fetch profile data on component mount
  useState(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("birthday, grade_level")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data.birthday) {
        setBirthday(new Date(data.birthday));
      }
      if (data.grade_level !== null) {
        setGradeLevel(data.grade_level);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || !birthday) return;

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

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Birthday</label>
        <Popover>
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
              onSelect={setBirthday}
              initialFocus
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