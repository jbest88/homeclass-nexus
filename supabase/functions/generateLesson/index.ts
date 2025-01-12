import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateLesson } from "./services/lessonService.ts";
import { corsHeaders } from "./utils.ts";

console.log("Generate lesson function started");

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

    const { subject, userId, isRetry } = await req.json();
    console.log(`Generating lesson for subject: ${subject}, userId: ${userId}, isRetry: ${isRetry}`);

    if (!subject || !userId) {
      throw new Error("Missing required parameters: subject and userId are required");
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const lesson = await generateLesson(geminiApiKey, subject, "Grade 5", "intermediate", 3, isRetry || false);
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