import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUser } from "@supabase/auth-helpers-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Json } from "@/integrations/supabase/types";
import GeneralTab from "./tabs/GeneralTab";
import PrivacyTab from "./tabs/PrivacyTab";
import NotificationsTab from "./tabs/NotificationsTab";
import SecurityTab from "./tabs/SecurityTab";
import { NotificationPreferences, PrivacySettings, SocialLinks } from "./types";

const ProfileSettings = () => {
  const user = useUser();
  const [birthday, setBirthday] = useState<Date>();
  const [gradeLevel, setGradeLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState<string>("");
  const [day, setDay] = useState<string>("");
  const [year, setYear] = useState<string>("");
  
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
          const notifPrefs = profile.notification_preferences as { [key: string]: boolean };
          setNotificationPreferences({
            email: notifPrefs.email ?? true,
            push: notifPrefs.push ?? true,
            in_app: notifPrefs.in_app ?? true
          });
        }
        if (profile.privacy_settings) {
          const privacyPrefs = profile.privacy_settings as { [key: string]: string };
          setPrivacySettings({
            profile_visibility: privacyPrefs.profile_visibility ?? "public",
            portfolio_visibility: privacyPrefs.portfolio_visibility ?? "public"
          });
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
          social_links: socialLinks as Json,
          notification_preferences: notificationPreferences as unknown as Json,
          privacy_settings: privacySettings as unknown as Json,
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

  if (isLoading) {
    return <div>Loading profile settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab
            month={month}
            setMonth={setMonth}
            day={day}
            setDay={setDay}
            year={year}
            setYear={setYear}
            gradeLevel={gradeLevel}
            bio={bio}
            setBio={setBio}
            languagePreference={languagePreference}
            setLanguagePreference={setLanguagePreference}
            timezone={timezone}
            setTimezone={setTimezone}
          />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacyTab
            privacySettings={privacySettings}
            setPrivacySettings={setPrivacySettings}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab
            notificationPreferences={notificationPreferences}
            setNotificationPreferences={setNotificationPreferences}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
      </Tabs>

      <Button onClick={handleSaveProfile} className="w-full">
        Save Changes
      </Button>
    </div>
  );
};

export default ProfileSettings;