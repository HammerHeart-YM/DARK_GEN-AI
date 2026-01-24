import React, { useState } from 'react';
import { generateImage } from '../services/imageGenerators';
import { Loader2, Download, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ImageGeneratorProps {
  selectedModelId: string;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ selectedModelId }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResultImage(null);

    try {
      const base64Image = await generateImage(prompt, selectedModelId, aspectRatio);
      setResultImage(base64Image);
    } catch (err: any) {
      setError(err.message || "Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full p-4 md:p-6 overflow-y-auto">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-3">
          <Sparkles className="text-indigo-500 dark:text-indigo-400" />
          Imagine
        </h2>
        <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-400">Creative Hub • {selectedModelId.split('/').pop()?.toUpperCase()}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
        {/* Controls */}
        <div className="w-full lg:w-1/3 lg:sticky lg:top-0 space-y-5 md:space-y-6 bg-white dark:bg-zinc-900/50 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-[10px] md:text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic city with flying cars..."
                className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm md:text-base text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500/50 h-24 md:h-32 resize-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] md:text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Aspect Ratio</label>
              <div className="grid grid-cols-3 md:grid-cols-3 gap-2">
                {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 md:py-2 rounded-lg text-xs md:text-sm border transition-all ${aspectRatio === ratio
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !prompt}
              className="w-full py-2.5 md:py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />}
              <span className="text-sm md:text-base">Generate</span>
            </button>
          </form>
          {error && <div className="text-red-500 dark:text-red-400 text-xs md:text-sm bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-200 dark:border-red-500/20">{error}</div>}
        </div>

        {/* Result */}
        <div className="w-full lg:w-2/3 flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] bg-gray-50 dark:bg-zinc-900/30 rounded-2xl md:rounded-3xl border border-gray-200 dark:border-white/5 border-dashed relative overflow-hidden transition-colors">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 md:w-16 h-12 md:h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-indigo-500 dark:text-indigo-400 animate-pulse w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
              <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-500 animate-pulse">Dreaming up your image...</p>
            </div>
          ) : resultImage ? (
            <div className="relative group w-full h-full flex items-center justify-center p-2 md:p-4">
              <img src={resultImage} alt="Generated" className="max-w-full max-h-[500px] md:max-h-[600px] rounded-lg shadow-2xl" />
              <div className="absolute bottom-4 md:bottom-6 right-4 md:right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={resultImage}
                  download={`imagine-${Date.now()}.png`}
                  className="bg-white text-black p-2.5 md:p-3 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center"
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 dark:text-zinc-600 flex flex-col items-center gap-3">
              <ImageIcon className="opacity-20 w-10 h-10 md:w-12 md:h-12" />
              <p className="text-xs md:text-sm px-4 text-center">Your creation will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};