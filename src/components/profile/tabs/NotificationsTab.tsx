import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NotificationPreferences } from "../types";

interface NotificationsTabProps {
  notificationPreferences: NotificationPreferences;
  setNotificationPreferences: (preferences: NotificationPreferences) => void;
}

const NotificationsTab = ({ 
  notificationPreferences, 
  setNotificationPreferences 
}: NotificationsTabProps) => {
  return (
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
          onCheckedChange={(checked) => setNotificationPreferences({
            ...notificationPreferences,
            email: checked
          })}
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
          onCheckedChange={(checked) => setNotificationPreferences({
            ...notificationPreferences,
            push: checked
          })}
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
          onCheckedChange={(checked) => setNotificationPreferences({
            ...notificationPreferences,
            in_app: checked
          })}
        />
      </div>
    </div>
  );
};

export default NotificationsTab;