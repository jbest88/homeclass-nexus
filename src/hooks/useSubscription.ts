import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Subscription } from "@/components/dashboard/DashboardHeader";

export const useSubscription = () => {
  const user = useUser();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('tier, is_active, expires_at')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data as Subscription;
    },
    enabled: !!user,
  });

  return {
    subscription,
    isLoading,
    tier: subscription?.tier || 'free',
    isActive: subscription?.is_active || false,
  };
};