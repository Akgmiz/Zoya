import { MicOff } from "lucide-react";

export function PermissionModal({ onRetry, onCancel }: { onRetry: () => void, onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all">
      <div className="bg-zinc-900 overflow-hidden border border-zinc-800 rounded-2xl shadow-2xl max-w-sm w-full font-sans text-zinc-300">
        <div className="p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 text-rose-500">
                <MicOff size={32} />
            </div>
            <h2 className="text-xl text-white font-rajdhani font-bold mb-2">Microphone Access Required</h2>
            <p className="text-sm font-mono leading-relaxed mb-6">
                Darling, I can't hear you if you don't give me microphone access. Click allow when the browser asks!
            </p>
        </div>
        <div className="flex border-t border-zinc-800">
          <button 
            onClick={onCancel} 
            className="flex-1 px-4 py-4 text-sm font-semibold hover:bg-zinc-800 transition"
          >
              Nevermind
          </button>
          <div className="w-[1px] bg-zinc-800" />
          <button 
            onClick={onRetry} 
            className="flex-1 px-4 py-4 text-sm font-semibold text-rose-400 hover:bg-zinc-800 transition"
          >
              Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
