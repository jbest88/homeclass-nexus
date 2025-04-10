// Define AIProvider type if not defined elsewhere, or just use string
export type AIProvider = string; // Example basic type

/**
 * Generates content using the specified AI model.
 * @param prompt The prompt to send to the AI.
 * @param modelName The name of the Gemini model to use (e.g., 'gemini-1.5-pro-latest').
 * @returns The generated text content.
 * @throws Error if generation fails after retries.
 */
export async function generateWithAI(prompt: string, modelName: AIProvider): Promise<string> {
  // Validate modelName format if necessary (e.g., ensure it's not empty)
  if (!modelName || typeof modelName !== 'string' || modelName.trim() === '') {
      throw new Error('Invalid AI model name provided.');
  }
  try {
    console.log(`Generating with Gemini model: ${modelName}...`);
    // Log only a snippet of the prompt for security/brevity
    console.log('Prompt snippet:', prompt.substring(0, 100) + "...");

    // Pass the modelName to the specific generator function
    return await generateWithGemini(prompt, modelName);
  } catch (error) {
    // Log error with model context for better debugging
    console.error(`Error during generation with model ${modelName}:`, error);
    // Re-throw the original error to be handled by the calling function (e.g., generateLesson or index.ts)
    throw error;
  }
}

/**
 * Internal function to interact with the Gemini API with retry logic.
 */
async function generateWithGemini(prompt: string, modelName: AIProvider): Promise<string> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (!geminiApiKey) {
    throw new Error("Gemini API key is not configured in environment variables");
  }

  const maxRetries = 3;
  let retries = 0;
  let lastError: Error | undefined;

  while (retries < maxRetries) {
    const attempt = retries + 1;
    try {
      console.log(`Attempt ${attempt} of ${maxRetries} to call Gemini API with model ${modelName}`);

      // *** Construct the endpoint dynamically using the modelName parameter ***
      // Note the format: /v1beta/models/{model_name}:{action}
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

      console.log("Using endpoint:", endpoint);

      const controller = new AbortController();
      // Add reason to abort signal for better debugging if timeout occurs
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
                // Ensure role is specified if required by the model/API version, otherwise parts is usually sufficient
                // role: "user", // Uncomment if needed
                parts: [{ text: prompt }]
              }
            ],
            // Adjust generationConfig as needed
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096, // Consider increasing if needed, check model limits
              // stopSequences: [], // Add stop sequences if needed
            },
            // Standard safety settings
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ]
          }),
          signal: controller.signal // Link abort controller
        });

      } finally {
        // Crucial: Always clear the timeout regardless of fetch outcome
        clearTimeout(timeout);
      }

      // --- Response Handling ---
      if (!response.ok) {
        const errorBody = await response.text();
        const status = response.status;
        const statusText = response.statusText;
        console.error(`Gemini API error response (Attempt ${attempt}): Status: ${status} ${statusText}, Body: ${errorBody}`);

        // Create a consistent error object
        lastError = new Error(`Gemini API error: ${status} ${statusText}. Body: ${errorBody}`);

        // Only retry on server errors (5xx) or potentially rate limits (429) if desired
        // Do NOT retry on 404 (Not Found), 400 (Bad Request), etc.
        if (status >= 500 && status < 600) {
            retries++;
            if (retries < maxRetries) {
                // Exponential backoff with jitter
                const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
                console.log(`Server error detected. Retrying after ${delay.toFixed(0)}ms delay...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue; // Continue to the next iteration of the while loop
            } else {
                console.error(`Failed after ${maxRetries} attempts due to persistent server errors.`);
                throw lastError; // Throw after max retries on 5xx
            }
        } else {
             // Throw immediately for non-retriable errors (4xx)
             throw lastError;
        }
      }

      // --- Process Successful Response ---
      const data = await response.json();
      // Log only the beginning of the response for brevity and to avoid large log entries
      // console.log("Raw Gemini API response data:", JSON.stringify(data)); // Uncomment for deep debugging

      // Safely access nested properties and check finishReason
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      const finishReason = candidate?.finishReason;

      console.log(`Gemini response finished with reason: ${finishReason || 'UNKNOWN'}`);

      // Handle cases where generation stopped for reasons other than 'STOP'
      if (finishReason && finishReason !== 'STOP') {
          console.warn(`Gemini generation finished abnormally: ${finishReason}.`);
          if (finishReason === 'SAFETY') {
              console.error('Gemini response blocked due to safety settings. Check prompt or safety config.');
              // Extract safety ratings info if available for logging
              const safetyRatings = candidate?.safetyRatings;
              console.error('Safety Ratings:', JSON.stringify(safetyRatings));
              throw new Error('Content generation blocked by safety filters.');
          } else if (finishReason === 'MAX_TOKENS') {
               console.warn('Generation stopped due to maximum output token limit.');
               // Return the partial text received
               if (text && typeof text === 'string') return text;
          } else {
              // Handle other reasons like RECITATION, etc.
               throw new Error(`Generation failed with unexpected finish reason: ${finishReason}`);
          }
      }


      // Validate the extracted text
      if (text && typeof text === 'string' && text.trim() !== '') {
        console.log('Successfully received valid text response from Gemini API');
        return text; // Success! Return the generated text
      } else {
        // Throw error if text is missing or empty after a successful API call status
        console.error('Invalid or empty text content in Gemini API response structure:', JSON.stringify(data));
        throw new Error('Received success status from API but response text is empty or invalid.');
      }

    } catch (error) {
      // Catch errors from fetch itself (e.g., network, timeout) or errors thrown above
      console.error(`Error during API call/processing on attempt ${attempt}:`, error.message);
      lastError = error instanceof Error ? error : new Error(String(error)); // Ensure lastError is an Error object

      retries++; // Increment retry counter

      // Check if it's a timeout error specifically or if retries are exhausted
      if (error.message.includes('timed out')) {
          console.warn(`Attempt ${attempt} timed out.`);
      }

      if (retries >= maxRetries) {
        console.error(`Failed after ${maxRetries} attempts.`);
        throw lastError; // Throw the last encountered error
      }

      // Decide if we should perform backoff delay based on the error type
      // We already handled retries for 5xx errors inside the try block.
      // Retry here mainly for network issues or timeouts caught by this outer catch.
      // Don't retry for errors explicitly thrown due to bad response format or safety blocks.
      const shouldRetryExplicitly = error.message.includes('timed out'); // Add other transient errors if needed

      if (shouldRetryExplicitly) {
            const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000; // Exponential backoff + jitter
            console.log(`Retrying after ${delay.toFixed(0)}ms delay following error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            // The loop will continue to the next iteration
      } else {
          // If it's not an error we want to retry (like 4xx, validation, safety), throw immediately.
          throw lastError;
      }
    }
  } // end while loop

  // This line should theoretically be unreachable if error handling/throwing within the loop is correct,
  // but serves as a final fallback.
  throw lastError || new Error('Failed to generate content after multiple attempts and reached end of function.');
}