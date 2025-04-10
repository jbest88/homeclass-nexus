/**
 * Generates content using the hardcoded Gemini model ("gemini-2.5-pro-exp-03-25").
 * @param prompt The prompt to send to the AI.
 * @returns The generated text content.
 * @throws Error if generation fails after retries.
 */
export async function generateWithAI(prompt: string): Promise<string> {
  // Hardcoded model name for consistency in logic and logging
  const hardcodedModelName = "gemini-2.5-pro-exp-03-25";
  try {
    console.log(`Generating with hardcoded Gemini model: ${hardcodedModelName}...`);
    // Log only a snippet of the prompt for security/brevity
    console.log('Prompt snippet:', prompt.substring(0, 100) + "...");

    // Call generateWithGemini which now also uses the hardcoded model
    return await generateWithGemini(prompt);
  } catch (error) {
    console.error(`Error during generation with model ${hardcodedModelName}:`, error);
    // Re-throw the original error to be handled upstream
    throw error;
  }
}

/**
 * Internal function to interact with the Gemini API using the hardcoded model
 * ("gemini-2.5-pro-exp-03-25") with retry logic.
 */
async function generateWithGemini(prompt: string): Promise<string> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (!geminiApiKey) {
    throw new Error("Gemini API key is not configured in environment variables");
  }

  // *** Hardcoded model name as per your requirement ***
  const hardcodedModelName = "gemini-2.5-pro-exp-03-25";

  const maxRetries = 3;
  let retries = 0;
  let lastError: Error | undefined;

  while (retries < maxRetries) {
    const attempt = retries + 1;
    try {
      console.log(`Attempt ${attempt} of ${maxRetries} to call Gemini API with model ${hardcodedModelName}`);

      // *** Construct the endpoint using the hardcoded model name ***
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${hardcodedModelName}:generateContent?key=${geminiApiKey}`;

      console.log("Using fixed endpoint:", endpoint);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error(`Request timed out after 45 seconds`)), 45000);

      let response: Response;
      try {
        console.log("Sending request to Gemini API...");
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096, // Increased from 2048, adjust as needed
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ]
          }),
          signal: controller.signal
        });

      } finally {
        clearTimeout(timeout);
      }

      // --- Response Handling ---
      if (!response.ok) {
        const errorBody = await response.text();
        const status = response.status;
        const statusText = response.statusText;
        // Include model name in error log
        console.error(`Gemini API error response (Attempt ${attempt}, Model ${hardcodedModelName}): Status: ${status} ${statusText}, Body: ${errorBody}`);
        lastError = new Error(`Gemini API error: ${status} ${statusText}. Body: ${errorBody}`);

        // Retry only on 5xx server errors
        if (status >= 500 && status < 600) {
          retries++;
          if (retries < maxRetries) {
            const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
            console.log(`Server error detected. Retrying after ${delay.toFixed(0)}ms delay...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            console.error(`Failed after ${maxRetries} attempts due to persistent server errors.`);
            throw lastError;
          }
        } else {
           // Throw immediately for non-retriable errors (e.g., 404 if model is invalid, 400, 429)
           throw lastError;
        }
      }

      // --- Process Successful Response ---
      const data = await response.json();
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      const finishReason = candidate?.finishReason;

      console.log(`Gemini response finished with reason: ${finishReason || 'UNKNOWN'}`);

      if (finishReason && finishReason !== 'STOP') {
          console.warn(`Gemini generation finished abnormally: ${finishReason}.`);
          if (finishReason === 'SAFETY') {
              console.error('Gemini response blocked due to safety settings.');
              const safetyRatings = candidate?.safetyRatings;
              console.error('Safety Ratings:', JSON.stringify(safetyRatings));
              throw new Error('Content generation blocked by safety filters.');
          } else if (finishReason === 'MAX_TOKENS') {
               console.warn('Generation stopped due to maximum output token limit.');
               if (text && typeof text === 'string') return text; // Return partial text
          } else {
               throw new Error(`Generation failed with unexpected finish reason: ${finishReason}`);
          }
      }

      if (text && typeof text === 'string' && text.trim() !== '') {
        console.log('Successfully received valid text response from Gemini API');
        return text;
      } else {
        console.error('Invalid or empty text content in Gemini API response structure:', JSON.stringify(data));
        throw new Error('Received success status from API but response text is empty or invalid.');
      }

    } catch (error) {
      // Catch errors from fetch or processing
      console.error(`Error during API call/processing on attempt ${attempt} (Model ${hardcodedModelName}):`, error.message);
      lastError = error instanceof Error ? error : new Error(String(error));
      retries++;

      if (retries >= maxRetries) {
        console.error(`Failed after ${maxRetries} attempts.`);
        throw lastError;
      }

      // Retry only on specific errors like timeout
      const shouldRetryExplicitly = error.message.includes('timed out');
      if (shouldRetryExplicitly) {
           const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
           console.log(`Retrying after ${delay.toFixed(0)}ms delay following error: ${error.message}`);
           await new Promise(resolve => setTimeout(resolve, delay));
      } else {
           // Don't retry other errors caught here (like 4xx, validation, safety thrown above)
           throw lastError;
      }
    }
  } // end while

  throw lastError || new Error(`Failed to generate content with ${hardcodedModelName} after multiple attempts.`);
}