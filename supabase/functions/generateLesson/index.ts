import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Adjust the import path and declaration according to your actual lessonService structure
import { generateLesson } from "./services/lessonService.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "./utils.ts"; // Assuming you have this file
// Assuming AIProvider type might be defined in aiService.ts or define it here/use string
// import { AIProvider } from "./services/aiService.ts";

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

    // Use a recommended stable model as the default. Verify current models in Gemini docs.
    const { subject, userId, isRetry, aiProvider = 'gemini-1.5-pro-latest', isPlacementTest = false } = await req.json();

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
      // *** IMPORTANT: Pass the actual aiProvider string to generateLesson ***
      const lesson = await generateLesson(
        subject,
        gradeLevelText,
        isRetry || false,
        aiProvider as string, // Explicitly pass the provider name
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
      let errorMessage = error.message || "Unknown error occurred";

      if (errorMessage.includes('API quota exceeded') || errorMessage.includes('rate limit')) {
        statusCode = 429; // Too Many Requests
      } else if (errorMessage.includes('404 Not Found')) {
          statusCode = 400; // Bad Request (likely invalid model name provided)
          errorMessage = `AI model provider error: ${errorMessage}. Please check the model name.`;
      } else if (errorMessage.includes('400 Bad Request')) {
           statusCode = 400;
           errorMessage = `AI model provider error: ${errorMessage}. Check request format or model name.`;
      } else if (errorMessage.includes('Content generation blocked by safety filters')) {
           statusCode = 400; // Or potentially 200 with a specific error structure
           errorMessage = error.message;
      }
       else if (
        errorMessage.includes('Gateway') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('502') ||
        errorMessage.includes('503') ||
        errorMessage.includes('504')
      ) {
        statusCode = 503; // Service Unavailable
        errorMessage = "AI service is temporarily unavailable. Please try again later.";
      }

      return new Response(JSON.stringify({
        error: errorMessage,
        // Consider removing stack trace in production for security
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
    console.error("Error in top-level request handler:", error);

    return new Response(JSON.stringify({
      error: error.message || "Unknown error occurred",
      // Consider removing stack trace in production for security
      details: error.stack,
    }), {
      status: 500, // General server error
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});