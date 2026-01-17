
import { SendMessageParams } from "../types";

export const sendMessageToHuggingFace = async (
    { text, modelId, signal }: SendMessageParams & { modelId: string },
    onStream: (chunk: string) => void,
    onStatusUpdate?: (status: string) => void
) => {
    const apiKey = import.meta.env.VITE_HF_TOKEN || (typeof process !== 'undefined' ? process.env.VITE_HF_TOKEN : undefined);

    if (!apiKey) {
        throw new Error("Missing Hugging Face API Token (VITE_HF_TOKEN). Please check your .env configuration.");
    }

    // Use the local proxy path defined in vite.config.ts to avoid CORS
    const endpoint = `/hf-api/${modelId}`;

    const makeRequest = async (retryCount = 0): Promise<void> => {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false"
                },
                body: JSON.stringify({
                    inputs: text,
                    parameters: {
                        max_new_tokens: 4000,
                        return_full_text: false,
                        temperature: 0.7,
                        stream: true
                    }
                }),
                signal
            });

            if (response.status === 503) {
                const errorData = await response.json().catch(() => ({}));
                const estimatedTime = errorData.estimated_time || 10;

                if (onStatusUpdate) {
                    onStatusUpdate(`Waking up the Neural Core... Please wait (~${Math.ceil(estimatedTime)}s).`);
                }

                // Wait and retry
                await new Promise(resolve => setTimeout(resolve, estimatedTime * 1000));
                return makeRequest(retryCount + 1);
            }

            if (response.status === 403) {
                throw new Error("Neural Core requires license acceptance on Hugging Face hub.");
            }

            if (!response.ok) {
                throw new Error(`HF API Error: ${response.status} ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder("utf-8");

            if (!reader) throw new Error("Response body is not readable");

            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n');
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;
                    if (trimmed.startsWith('data:')) {
                        try {
                            const json = JSON.parse(trimmed.slice(5));
                            if (json.token?.text) {
                                onStream(json.token.text);
                            } else if (json.generated_text) {
                                onStream(json.generated_text);
                            }
                        } catch (e) {
                            console.warn("Error parsing HF stream chunk", e);
                        }
                    }
                }
            }

        } catch (error: any) {
            if (signal?.aborted) return;
            throw error;
        }
    };

    await makeRequest();
};
