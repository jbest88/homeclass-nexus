import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateLesson } from "./services/lessonService.ts";
import { corsHeaders } from "./utils.ts";

console.log("Generate lesson function started");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  try {
    const { subject, userId, isRetry } = await req.json();
    console.log(`Generating lesson for subject: ${subject}, userId: ${userId}, isRetry: ${isRetry}`);

    if (!subject || !userId) {
      throw new Error("Missing required parameters");
    }

    const lesson = await generateLesson(subject, isRetry);
    console.log("Lesson generated successfully");

    return new Response(JSON.stringify(lesson), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error generating lesson:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});