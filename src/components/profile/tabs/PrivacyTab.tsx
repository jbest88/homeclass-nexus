import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrivacySettings } from "../types";

interface PrivacyTabProps {
  privacySettings: PrivacySettings;
  setPrivacySettings: (settings: PrivacySettings) => void;
}

const PrivacyTab = ({ privacySettings, setPrivacySettings }: PrivacyTabProps) => {
  return (
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
          onValueChange={(value) => setPrivacySettings({
            ...privacySettings,
            profile_visibility: value
          })}
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
          onValueChange={(value) => setPrivacySettings({
            ...privacySettings,
            portfolio_visibility: value
          })}
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
  );
};

export default PrivacyTab;