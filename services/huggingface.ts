
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

    // Endpoint construction for Router API:
    // Proxy: /hf-api -> https://router.huggingface.co/hf-inference
    // Target Path: /models/[model_id]/v1/chat/completions
    // Resulting Proxy Path: /hf-api/models/[model_id]/v1/chat/completions

    // Note: The vite config maps /hf-api -> /models on the target.
    // So if I call /hf-api/[modelId]/v1/chat/completions, it rewrites to /models/[modelId]/v1/chat/completions
    // which effectively hits https://router.huggingface.co/hf-inference/models/[modelId]/v1/chat/completions
    // Wait, the vite config rewrites `^/hf-api` to `/models`. 
    // So `/hf-api/${modelId}/v1/chat/completions` becomes `/models/${modelId}/v1/chat/completions` on the target.
    // Target is `https://router.huggingface.co/hf-inference`.
    // Combined: `https://router.huggingface.co/hf-inference/models/${modelId}/v1/chat/completions`.
    // This matches the standard router pattern.

    const endpoint = `/hf-api/${modelId}/v1/chat/completions`;

    const makeRequest = async (retryCount = 0): Promise<void> => {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: modelId, // OpenAI spec includes model in body
                    messages: [
                        { role: "user", content: text }
                    ],
                    max_tokens: 4000,
                    stream: true,
                    temperature: 0.7
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

            if (response.status === 404 || response.status === 410) {
                throw new Error(`Model not found or endpoint deprecated (${response.status}). Verify model ID.`);
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HF API Error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder("utf-8");

            if (!reader) throw new Error("Response body is not readable");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;

                    if (trimmed.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmed.slice(6); // Remove 'data: '
                            const json = JSON.parse(jsonStr);
                            const content = json.choices?.[0]?.delta?.content;

                            if (content) {
                                onStream(content);
                            }
                        } catch (e) {
                            console.warn("Error parsing HF stream chunk:", e);
                        }
                    }
                }
            }

        } catch (error: any) {
            if (signal?.aborted) return;
            console.error("HF Inference Error:", error);
            throw error;
        }
    };

    await makeRequest();
};
