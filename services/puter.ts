import { SendMessageParams } from "../types";

// Extend the Window interface to include the 'puter' object
declare global {
  interface Window {
    puter: any;
  }
}

export const sendMessageToPuter = async (
  { text, file }: SendMessageParams,
  onStream: (chunk: string) => void
) => {
  // Check if the Puter.js script has loaded successfully
  if (!window.puter) {
    console.error("Puter.js script failed to load. Please check the script tag in index.html.");
    throw new Error("Puter.js script not found.");
  }

  let prompt = text;
  if (file) {
    // Note: This is a simplified approach. True file handling would require uploading the file first.
    prompt = `[System: The user attached a file named ${file.name}. You can reference it in your response, but cannot access its content directly in this mode.]\n\n${text}`;
  }

  try {
    // Use the globally available puter object
    const stream = await window.puter.ai.chat(prompt, {
      stream: true,
      model: 'llama-3-70b-instruct',
      max_tokens: 4000
    });

    // Process the stream and send chunks as they arrive
    for await (const chunk of stream) {
      const content = chunk.message?.content;
      if (content) {
        onStream(content);
      }
    }
  } catch (error) {
    console.error("Puter.js error:", error);
    // Handle potential non-async-iterable error from the original problem description
    if (error instanceof TypeError && error.message.includes("is not async iterable")) {
        throw new Error("The response from Puter.js was not in the expected format. Please try again.");
    }
    throw error;
  }
};
