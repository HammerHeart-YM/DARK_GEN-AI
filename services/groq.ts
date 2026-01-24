import { SendMessageParams } from "../types";

export interface GroqMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export const sendMessageToGroq = async (
    { text, file, modelId, signal }: SendMessageParams,
    onStream?: (chunk: string) => void
) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey || apiKey.includes("PLACE_YOUR_KEY")) {
        throw new Error("Groq Key Missing. Get one at console.groq.com");
    }

    const endpoint = "https://api.groq.com/openai/v1/chat/completions";
    const model = modelId || "llama-3.3-70b-versatile";

    // System prompt to set behavior
    const messages: GroqMessage[] = [
        {
            role: 'system',
            content: 'You are Dark AI, a sophisticated, highly capable AI assistant. Be concise, precise, and helpful.'
        },
        { role: 'user', content: text }
    ];

    if (file) {
        // Note: Groq may not currently support multimodal input directly in all models/endpoints in the same way.
        // We'll append file info to the text for now or handle as text context if possible.
        messages[1].content = `[Attached File: ${file.name}]\n${text}`;
    }

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: 1024,
                temperature: 0.7,
                stream: true
            }),
            signal
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Groq API Error: ${response.status} ${response.statusText}`);
        }

        if (!response.body) throw new Error("No response body from Groq API");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (line.startsWith("data: ") && line !== "data: [DONE]") {
                    try {
                        const json = JSON.parse(line.substring(6));
                        const content = json.choices?.[0]?.delta?.content;
                        if (content && onStream) {
                            onStream(content);
                        }
                    } catch (e) {
                        console.warn("Error parsing Groq stream chunk", e);
                    }
                }
            }
        }

    } catch (error: any) {
        console.error("Groq API Error:", error);
        throw error;
    }
};
