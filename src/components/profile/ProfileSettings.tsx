import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUser } from "@supabase/auth-helpers-react";

const ProfileSettings = () => {
  const user = useUser();
  const [birthday, setBirthday] = useState<Date>();
  const [gradeLevel, setGradeLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState<string>("");
  const [day, setDay] = useState<string>("");
  const [year, setYear] = useState<string>("");

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
          
          setGradeLevel(null);
          setBirthday(undefined);
          return;
        }

        // Profile exists, set the data
        if (profile.birthday) {
          const date = new Date(profile.birthday);
          setBirthday(date);
          setMonth((date.getMonth() + 1).toString());
          setDay(date.getDate().toString());
          setYear(date.getFullYear().toString());
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
    if (!user || !month || !day || !year) {
      toast.error("Please select a complete birthday");
      return;
    }

    try {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      // Validate the date is valid
      if (isNaN(date.getTime())) {
        toast.error("Invalid date selected");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          id: user.id,
          birthday: date.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      setBirthday(date);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return <div>Loading profile settings...</div>;
  }

  // Generate arrays for the dropdowns
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' })
  }));
  
  const days = Array.from({ length: 31 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString()
  }));
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString()
  }));

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <label className="block text-sm font-medium mb-1">Birthday</label>
        <div className="grid grid-cols-3 gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={day} onValueChange={setDay}>
            <SelectTrigger>
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              {days.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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