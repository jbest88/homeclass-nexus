import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateLesson } from "./services/lessonService.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "./utils.ts";
import { AIProvider } from "./services/aiService.ts";

console.log("Generate lesson function started");

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      throw new Error(`Method ${req.method} not allowed`);
    }

    const { subject, userId, isRetry, aiProvider = 'gemini', isPlacementTest = false } = await req.json();
    console.log(`Generating ${isPlacementTest ? 'placement test' : 'lesson'} for subject: ${subject}, userId: ${userId}, isRetry: ${isRetry}, provider: ${aiProvider}`);

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
      isRetry || false,
      aiProvider as AIProvider,
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
    console.error("Error in generateLesson function:", error);
    
    const errorResponse = {
      error: error.message,
      details: error.stack,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: error.message.includes('API quota exceeded') ? 429 : 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});