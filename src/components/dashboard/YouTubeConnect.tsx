import { Button } from "@/components/ui/button";
import { Youtube } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const YouTubeConnect = () => {
  const handleConnect = async () => {
    try {
      const { data: { client_id } } = await supabase.functions.invoke('getYouTubeOAuthUrl');
      
      // Create OAuth window
      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${client_id}` +
        `&redirect_uri=${window.location.origin}/youtube-callback` +
        `&response_type=code` +
        `&scope=https://www.googleapis.com/auth/youtube.readonly` +
        `&access_type=offline`,
        'YouTube Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error) {
      console.error('Error starting YouTube OAuth:', error);
      toast.error('Failed to connect to YouTube');
    }
  };

  return (
    <Button 
      variant="outline" 
      className="flex items-center gap-2" 
      onClick={handleConnect}
    >
      <Youtube className="h-4 w-4" />
      Connect YouTube
    </Button>
  );
};