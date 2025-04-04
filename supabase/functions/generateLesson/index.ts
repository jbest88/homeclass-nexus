
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateLesson } from "./services/lessonService.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "./utils.ts";
import { AIProvider } from "./services/aiService.ts";

console.log("Generate lesson function started");

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      throw new Error(`Method ${req.method} not allowed`);
    }

    const { subject, userId, isRetry, isPlacementTest = false } = await req.json();
    const aiProvider: AIProvider = 'gemini-2.5-pro-exp-03-25';
    
    console.log(`Generating ${isPlacementTest ? 'placement test' : 'lesson'} for subject: ${subject}, userId: ${userId}, isRetry: ${isRetry}, provider: ${aiProvider}`);

    if (!subject || !userId) {
      throw new Error("Missing required parameters: subject and userId are required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials are not configured");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's grade level from profiles
    console.log("Fetching user's grade level...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("grade_level")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw new Error("Failed to fetch user's grade level");
    }

    const gradeLevel = profile?.grade_level ?? 0;
    const gradeLevelText = gradeLevel === 0 ? "Kindergarten" : `Grade ${gradeLevel}`;
    console.log(`User's grade level: ${gradeLevelText}`);

    try {
      const lesson = await generateLesson(
        subject,
        gradeLevelText,
        isRetry || false,
        aiProvider,
        isPlacementTest
      );
      console.log("Lesson generated successfully");

      return new Response(JSON.stringify(lesson), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error generating lesson content:", error);
      
      // Check for specific error types to return appropriate status codes
      let statusCode = 500;
      if (error.message.includes('API quota exceeded') || error.message.includes('rate limit')) {
        statusCode = 429; // Too Many Requests
      } else if (error.message.includes('Gateway') || error.message.includes('timeout')) {
        statusCode = 503; // Service Unavailable
      }
      
      return new Response(JSON.stringify({
        error: error.message,
        details: error.stack,
      }), {
        status: statusCode,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    console.error("Error in generateLesson function:", error);
    
    return new Response(JSON.stringify({
      error: error.message,
      details: error.stack,
    }), {
      status: error.message.includes('API quota exceeded') ? 429 : 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
