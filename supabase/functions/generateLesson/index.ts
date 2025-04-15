
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateLesson } from "./services/lessonService.ts"; // Added .ts extension
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "./utils.ts"; // Assuming you have this file

console.log("Generate lesson function started (using hardcoded AI model: gemini-2.5-pro-exp-03-25)");

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      throw new Error(`Method ${req.method} not allowed`);
    }

    // Extract parameters from request
    // aiProvider is extracted for potential logging/other uses but IS IGNORED for model selection.
    const { subject, userId, isRetry, aiProvider, isPlacementTest = false } = await req.json();

    // Log received provider for informational purposes, but clarify model is hardcoded
    const logProvider = aiProvider ? `(received provider parameter: ${aiProvider}, but model is hardcoded)` : '';
    console.log(`Generating ${isPlacementTest ? 'placement test' : 'lesson'} for subject: ${subject}, userId: ${userId}, isRetry: ${isRetry} ${logProvider}`);

    if (!subject || !userId) {
      throw new Error("Missing required parameters: subject and userId are required");
    }

    // Initialize Supabase client (same as before)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials are not configured");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's grade level (same as before)
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
      // *** Call generateLesson WITHOUT the aiProvider argument ***
      const lesson = await generateLesson(
        subject,
        gradeLevelText,
        isRetry || false,
        isPlacementTest
      );
      console.log("Lesson generation process completed successfully.");

      return new Response(JSON.stringify(lesson), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (error) {
      console.error("Error during lesson generation process:", error);

      // Updated error handling
      let statusCode = 500;
      let errorMessage = error.message || "Unknown error occurred";

      if (errorMessage.includes('API quota exceeded') || errorMessage.includes('rate limit')) {
         statusCode = 429; // Too Many Requests
      } else if (errorMessage.includes('404 Not Found')) {
          // This now implies the HARDCODED model name is wrong/deprecated
          statusCode = 500; // Internal Server Error (Configuration Error)
          errorMessage = `AI model configuration error: ${errorMessage}. The hardcoded model 'gemini-2.5-pro-exp-03-25' may be invalid or deprecated.`;
      } else if (errorMessage.includes('400 Bad Request')) {
           statusCode = 400; // Bad Request (Could be prompt issue, safety settings, etc.)
           errorMessage = `AI model provider error: ${errorMessage}. Check prompt or safety settings.`;
      } else if (errorMessage.includes('Content generation blocked by safety filters')) {
           statusCode = 400; // Bad Request (Triggered by prompt)
           errorMessage = error.message;
      } else if (
        errorMessage.includes('Gateway') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('502') ||
        errorMessage.includes('503') ||
        errorMessage.includes('504')
      ) {
        statusCode = 503; // Service Unavailable
        errorMessage = "AI service is temporarily unavailable. Please try again later.";
      }
      // Default to 500 for other errors

      return new Response(JSON.stringify({
        error: errorMessage,
        details: error.stack, // Consider removing stack trace in production responses for security
      }), {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in top-level request handler:", error);
    return new Response(JSON.stringify({
      error: error.message || "Unknown error occurred",
      details: error.stack, // Consider removing stack trace in production responses for security
    }), {
      status: 500, // General server error
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
