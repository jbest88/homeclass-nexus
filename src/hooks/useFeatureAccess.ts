import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFeatureAccess = (featureCode: string) => {
  const user = useUser();

  const { data: hasAccess, isLoading } = useQuery({
    queryKey: ["feature-access", featureCode, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .rpc('check_feature_access', {
          user_id: user.id,
          feature_code: featureCode
        });

      if (error) {
        console.error('Error checking feature access:', error);
        return false;
      }

      return data;
    },
    enabled: !!user,
  });

  return {
    hasAccess: !!hasAccess,
    isLoading,
  };
};