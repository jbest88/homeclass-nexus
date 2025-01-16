import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Get YouTube OAuth URL function started");

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const clientId = Deno.env.get("YOUTUBE_OAUTH_CLIENT_ID");
    if (!clientId) {
      throw new Error("YouTube OAuth client ID not configured");
    }

    return new Response(
      JSON.stringify({ client_id: clientId }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error in getYouTubeOAuthUrl:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});