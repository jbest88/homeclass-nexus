import { Button } from "@/components/ui/button";
import { LogOut, Plus, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

export interface Subscription {
  tier: 'free' | 'basic' | 'premium' | 'enterprise';
  is_active: boolean;
  expires_at: string | null;
}

interface DashboardHeaderProps {
  subscription: Subscription | null;
  isLoading: boolean;
  onCreateLesson: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const DashboardHeader = ({
  subscription,
  isLoading,
  onCreateLesson,
  onOpenProfile,
  onLogout,
}: DashboardHeaderProps) => {
  const isMobile = useIsMobile();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
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
        <Button onClick={onCreateLesson} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          {!isMobile && "Create Lesson"}
          {isMobile && "Create"}
        </Button>

        <Button
          variant="outline"
          onClick={onOpenProfile}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Settings className="h-4 w-4" />
          {!isMobile && "My Profile"}
          {isMobile && "Profile"}
        </Button>

        <Button
          onClick={onLogout}
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <LogOut className="h-4 w-4" />
          {!isMobile && "Logout"}
        </Button>
      </div>
    </div>
  );
};