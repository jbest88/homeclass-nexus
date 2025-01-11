import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUser } from "@supabase/auth-helpers-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  in_app: boolean;
}

interface PrivacySettings {
  profile_visibility: string;
  portfolio_visibility: string;
}

interface SocialLinks {
  [key: string]: string;
}

const ProfileSettings = () => {
  const user = useUser();
  const [birthday, setBirthday] = useState<Date>();
  const [gradeLevel, setGradeLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState<string>("");
  const [day, setDay] = useState<string>("");
  const [year, setYear] = useState<string>("");
  
  // New state variables with proper typing
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    email: true,
    push: true,
    in_app: true,
  });
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profile_visibility: "public",
    portfolio_visibility: "public",
  });
  const [languagePreference, setLanguagePreference] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch or create profile on component mount
  useEffect(() => {
    const fetchOrCreateProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (!profile) {
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({ id: user.id });

          if (insertError) throw insertError;
          return;
        }

        // Set all profile data with proper type checking
        if (profile.birthday) {
          const date = new Date(profile.birthday);
          setBirthday(date);
          setMonth((date.getMonth() + 1).toString());
          setDay(date.getDate().toString());
          setYear(date.getFullYear().toString());
        }
        if (profile.grade_level !== null) setGradeLevel(profile.grade_level);
        if (profile.bio) setBio(profile.bio);
        if (profile.interests) setInterests(profile.interests as string[]);
        if (profile.skills) setSkills(profile.skills as string[]);
        if (profile.portfolio_items) setPortfolioItems(profile.portfolio_items);
        if (profile.social_links) setSocialLinks(profile.social_links as SocialLinks);
        if (profile.notification_preferences) {
          setNotificationPreferences(profile.notification_preferences as NotificationPreferences);
        }
        if (profile.privacy_settings) {
          setPrivacySettings(profile.privacy_settings as PrivacySettings);
        }
        if (profile.language_preference) setLanguagePreference(profile.language_preference);
        if (profile.timezone) setTimezone(profile.timezone);

      } catch (error) {
        console.error("Error fetching/creating profile:", error);
        toast.error("Failed to load profile settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrCreateProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error("Please sign in to save your profile");
      return;
    }

    try {
      const date = month && day && year 
        ? new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        : null;

      if (date && isNaN(date.getTime())) {
        toast.error("Invalid date selected");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          birthday: date?.toISOString().split('T')[0],
          bio,
          interests,
          skills,
          portfolio_items: portfolioItems,
          social_links: socialLinks,
          notification_preferences: notificationPreferences,
          privacy_settings: privacySettings,
          language_preference: languagePreference,
          timezone,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
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
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Birthday</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {gradeLevel !== null && (
              <div>
                <Label>Current Grade Level</Label>
                <div className="text-lg font-semibold">
                  {gradeLevel === 0 ? "Kindergarten" : `Grade ${gradeLevel}`}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Grade level is automatically calculated based on your birthday
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={languagePreference} onValueChange={setLanguagePreference}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">
                  Control who can see your profile
                </p>
              </div>
              <Select 
                value={privacySettings.profile_visibility}
                onValueChange={(value) => setPrivacySettings(prev => ({
                  ...prev,
                  profile_visibility: value
                }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="registered">Registered Users</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Portfolio Visibility</Label>
                <p className="text-sm text-muted-foreground">
                  Control who can see your portfolio
                </p>
              </div>
              <Select 
                value={privacySettings.portfolio_visibility}
                onValueChange={(value) => setPrivacySettings(prev => ({
                  ...prev,
                  portfolio_visibility: value
                }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="registered">Registered Users</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={notificationPreferences.email}
                onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                  ...prev,
                  email: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications
                </p>
              </div>
              <Switch
                checked={notificationPreferences.push}
                onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                  ...prev,
                  push: checked
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications within the app
                </p>
              </div>
              <Switch
                checked={notificationPreferences.in_app}
                onCheckedChange={(checked) => setNotificationPreferences(prev => ({
                  ...prev,
                  in_app: checked
                }))}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button onClick={handlePasswordChange}>
              Update Password
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Button onClick={handleSaveProfile} className="w-full">
        Save Changes
      </Button>
    </div>
  );
};

export default ProfileSettings;