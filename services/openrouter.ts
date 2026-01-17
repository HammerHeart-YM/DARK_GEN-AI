
import { SendMessageParams } from "../types";

const FALLBACK_MODELS = [
  'google/gemini-2.0-flash-lite-preview-02-05:free',
  'mistralai/mistral-small-24b-instruct-2501:free',
  'meta-llama/llama-3.3-70b-instruct:free'
];

export const sendMessageToOpenRouter = async (
  { text, file, modelId, signal }: SendMessageParams & { modelId?: string },
  onStream: (chunk: string) => void,
  onStatusUpdate?: (status: string) => void
) => {
  const apiKey = import.meta.env?.VITE_OPENROUTER_KEY ||
    (typeof process !== 'undefined' ? process.env?.VITE_OPENROUTER_KEY : undefined);

  if (!apiKey || apiKey.includes("PLACE_YOUR_KEY")) {
    throw new Error("OpenRouter API Key is missing. Please set VITE_OPENROUTER_KEY in your .env file.");
  }

  // Determine initial model queue
  // If user selected a specific model, try that first. Then try fallbacks.
  // Exception: If the user explicitly picked one of the fallbacks, we might just try that and then others.
  // For simplicity, we always prepend the requested modelId (if valid) to the fallback list, removing duplicates.

  let candidates = [modelId, ...FALLBACK_MODELS].filter((m): m is string => !!m);
  candidates = [...new Set(candidates)]; // Dedupe

  let lastError: any = null;

  for (let i = 0; i < candidates.length; i++) {
    const currentModel = candidates[i];

    // Notify fallback if this is not the first attempt
    if (i > 0 && onStatusUpdate) {
      onStatusUpdate(`Rerouting Neural Link... Connected to ${currentModel.split('/')[1]}`);
    }

    try {
      await attemptRequest(currentModel, text, file, apiKey, signal, onStream);
      return; // Success!
    } catch (error: any) {
      console.warn(`Attempt failed for ${currentModel}:`, error);

      // Only ignore specific errors for fallback? Or all?
      // Prompt says: "If Attempt 1 returns 429 or 404, immediately try Attempt 2..."
      // We will catch all non-abort errors.
      if (signal?.aborted) throw error;

      lastError = error;
      // Continue to next candidate
    }
  }

  // All failed
  throw lastError || new Error("All OpenRouter connection attempts failed.");
};

async function attemptRequest(
  modelId: string,
  text: string,
  file: File | undefined,
  apiKey: string,
  signal: AbortSignal | undefined,
  onStream: (chunk: string) => void
) {
  const messages: any[] = [];

  if (file) {
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.readAsDataURL(file);
    });

    messages.push({
      role: "user",
      content: [
        { type: "text", text },
        { type: "image_url", image_url: { url: base64Data } }
      ]
    });
  } else {
    messages.push({ role: "user", content: text });
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "DARK AI",
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages,
      stream: true,
    }),
    signal
  });

  if (!response.ok) {
    // If 404 or 429, throw to trigger fallback
    // Actually any error should trigger fallback per ladder logic usually
    const errText = await response.text();
    throw new Error(`OpenRouter Error ${response.status}: ${errText}`);
  }

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((line) => line.trim() !== "");

    for (const line of lines) {
      if (line === "data: [DONE]") return;
      if (line.startsWith("data: ")) {
        const jsonStr = line.replace("data: ", "");
        try {
          const json = JSON.parse(jsonStr);
          const content = json.choices[0]?.delta?.content || "";
          if (content) {
            onStream(content);
          }
        } catch (e) {
          console.error("Error parsing stream", e);
        }
      }
    }
  }
}