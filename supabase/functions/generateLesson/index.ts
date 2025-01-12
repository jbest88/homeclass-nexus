import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateLesson } from "./services/lessonService.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("Generate lesson function started");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          ...corsHeaders,
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Validate request method
    if (req.method !== "POST") {
      throw new Error(`Method ${req.method} not allowed`);
    }

    const { subject, userId, isRetry } = await req.json();
    console.log(`Generating lesson for subject: ${subject}, userId: ${userId}, isRetry: ${isRetry}`);

    if (!subject || !userId) {
      throw new Error("Missing required parameters: subject and userId are required");
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
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

    const lesson = await generateLesson(
      geminiApiKey,
      subject,
      gradeLevelText,
      isRetry || false
    );
    console.log("Lesson generated successfully");

    return new Response(JSON.stringify(lesson), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in generateLesson function:", error);
    
    const errorResponse = {
      error: error.message,
      details: error.stack,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});