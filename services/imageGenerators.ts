
import { HfInference } from "@huggingface/inference";
import { generateImageWithGemini } from "./gemini";

const getHFToken = () => import.meta.env.VITE_HF_TOKEN;

export const generateImage = async (prompt: string, modelId: string, aspectRatio: string = "1:1"): Promise<string> => {
    // 1. Native Gemini
    if (modelId === 'gemini-2.5-flash-image' || modelId.includes('gemini')) {
        return generateImageWithGemini(prompt, aspectRatio);
    }

    // 2. Pollinations.ai (FREE, No Key, High Speed)
    if (modelId.includes('pollinations')) {
        const seed = Math.floor(Math.random() * 1000000);
        const width = aspectRatio === '16:9' ? 1280 : aspectRatio === '9:16' ? 720 : 1024;
        const height = aspectRatio === '16:9' ? 720 : aspectRatio === '9:16' ? 1280 : 1024;
        const model = modelId.includes('flux') ? 'flux' : 'turbo';

        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;

        // Fetch and convert to base64 to maintain consistency
        const response = await fetch(url);
        if (!response.ok) throw new Error("Pollinations generation failed");
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    }

    // 3. Hugging Face
    const hfToken = getHFToken();
    if (hfToken && (modelId.startsWith('black-forest-labs') || modelId.startsWith('stabilityai') || modelId.startsWith('runwayml'))) {
        const hf = new HfInference(hfToken);
        const result = await hf.textToImage({
            model: modelId,
            inputs: prompt,
            parameters: {
                negative_prompt: "blurry, bad quality, distorted",
            }
        });
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(result as unknown as Blob);
        });
    }

    throw new Error(`Model ${modelId} not supported or key missing.`);
};
