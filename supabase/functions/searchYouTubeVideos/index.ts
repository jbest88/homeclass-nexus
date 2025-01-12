import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YouTubeSearchResponse {
  items: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      description: string;
    };
  }>;
}

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          ...corsHeaders,
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Validate request method
    if (req.method !== "POST") {
      throw new Error(`Method ${req.method} not allowed`);
    }

    const { topics } = await req.json();
    console.log("Searching videos for topics:", topics);

    if (!Array.isArray(topics)) {
      throw new Error("Topics must be an array");
    }

    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    if (!YOUTUBE_API_KEY) {
      throw new Error("YouTube API key not configured");
    }

    // Search for one video per three topics
    const videoPromises = [];
    for (let i = 0; i < topics.length; i += 3) {
      const topicGroup = topics.slice(i, i + 3);
      const searchQuery = topicGroup.join(" ");
      
      const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      searchUrl.searchParams.append("part", "snippet");
      searchUrl.searchParams.append("q", `${searchQuery} educational tutorial`);
      searchUrl.searchParams.append("type", "video");
      searchUrl.searchParams.append("maxResults", "1");
      searchUrl.searchParams.append("videoEmbeddable", "true");
      searchUrl.searchParams.append("key", YOUTUBE_API_KEY);

      videoPromises.push(
        fetch(searchUrl.toString())
          .then(response => response.json())
          .then((data: YouTubeSearchResponse) => {
            if (data.items?.[0]) {
              return {
                videoId: data.items[0].id.videoId,
                title: data.items[0].snippet.title,
                description: data.items[0].snippet.description,
                topics: topicGroup,
              };
            }
            return null;
          })
      );
    }

    const videos = await Promise.all(videoPromises);
    const filteredVideos = videos.filter(video => video !== null);

    console.log(`Found ${filteredVideos.length} videos`);

    return new Response(JSON.stringify(filteredVideos), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in searchYouTubeVideos function:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});