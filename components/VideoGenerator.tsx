import React, { useState } from 'react';
import { generateVideoWithVeo } from '../services/gemini';
import { Loader2, Download, Video, Film } from 'lucide-react';

interface VideoGeneratorProps {
  selectedModelId: string;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ selectedModelId }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResultVideo(null);

    try {
      // Pass the selected model variant if available
      const videoUri = await generateVideoWithVeo(prompt);
      setResultVideo(videoUri);
    } catch (err: any) {
      setError(err.message || "Failed to generate video. Ensure you have a paid key with Veo access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-4 md:p-6 overflow-y-auto">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-3">
          <Film className="text-indigo-500 dark:text-indigo-400" />
          Video Studio
        </h2>
        <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-400">Cinematic Engine • {selectedModelId.split('-').slice(0, 2).join(' ').toUpperCase()}</p>
      </div>

      <div className="flex flex-col gap-6 md:gap-8 items-center">
        {/* Controls */}
        <div className="w-full max-w-2xl space-y-4 bg-white dark:bg-zinc-900/50 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-[10px] md:text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A cinematic drone shot of a cyberpunk city at night..."
                className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm md:text-base text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500/50 h-20 md:h-24 resize-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !prompt}
              className="w-full py-2.5 md:py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/20"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : <Video className="w-4 h-4 md:w-5 md:h-5" />}
              <span className="text-sm md:text-base">Generate Video</span>
            </button>
          </form>
          {error && <div className="text-red-500 dark:text-red-400 text-xs md:text-sm bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-200 dark:border-red-500/20">{error}</div>}
        </div>

        {/* Result */}
        {resultVideo && (
          <div className="w-full max-w-3xl mt-2 md:mt-4 rounded-2xl md:rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl bg-black">
            <video controls className="w-full aspect-video" src={resultVideo} autoPlay loop />
            <div className="p-3 md:p-4 bg-white dark:bg-zinc-900 flex justify-between items-center border-t border-gray-100 dark:border-white/5">
              <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Generated with Veo</span>
              <a href={resultVideo} download className="flex items-center gap-2 text-xs md:text-sm text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-white transition-colors">
                <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> Download
              </a>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 md:py-12">
            <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4 w-8 h-8 md:w-10 md:h-10" />
            <h3 className="text-gray-900 dark:text-white font-medium text-sm md:text-base">Rendering Video</h3>
            <p className="text-gray-500 dark:text-zinc-500 text-xs md:text-sm mt-1">This may take a minute or two...</p>
          </div>
        )}
      </div>
    </div>
  );
};