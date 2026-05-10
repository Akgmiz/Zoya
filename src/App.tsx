import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2, Volume2, VolumeX } from "lucide-react";
import { LiveSessionManager } from "./services/liveService";
import { Visualizer } from "./components/Visualizer";
import { PermissionModal } from "./components/PermissionModal";
import FileUploadButton from "./components/FileUploadButton";
import { motion, AnimatePresence } from "motion/react";

type AppState = "idle" | "connecting" | "listening" | "speaking";

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const liveSessionRef = useRef<LiveSessionManager | null>(null);

  // Pass mute state to session
  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.isMuted = isMuted;
    }
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      liveSessionRef.current?.stop();
    };
  }, []);

  const toggleSession = async () => {
    if (liveSessionRef.current) {
      // Stop session
      liveSessionRef.current.stop();
      liveSessionRef.current = null;
      setAppState("idle");
      return;
    }

    try {
      setAppState("connecting");
      const session = new LiveSessionManager();
      session.isMuted = isMuted;
      liveSessionRef.current = session;

      session.onStateChange = (state) => setAppState(state);

      // Optional: handle browser commands silently
      session.onCommand = (url) => {
        setTimeout(() => window.open(url, "_blank"), 500);
      };

      await session.start();
    } catch (error) {
      console.error("Failed to start session:", error);
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setShowPermissionModal(true);
      }
      setAppState("idle");
      liveSessionRef.current = null;
    }
  };

  return (
    <div className="h-[100dvh] w-screen bg-[#050505] text-white flex flex-col items-center justify-between font-sans relative overflow-hidden m-0 p-0">
      {showPermissionModal && (
        <PermissionModal 
          onRetry={() => {
            setShowPermissionModal(false);
            toggleSession();
          }} 
          onCancel={() => setShowPermissionModal(false)} 
        />
      )}

      {/* Background gradients */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-900/20 blur-[120px] rounded-full" />
      </div>

      {/* Header with mute & brand */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center z-20 px-6 py-4 md:px-12 md:py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 flex items-center justify-center font-bold text-sm">
            R
          </div>
          <h1 className="text-xl font-serif font-medium tracking-wide opacity-90">Rosy</h1>
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX size={18} className="opacity-70" />
          ) : (
            <Volume2 size={18} className="opacity-70" />
          )}
        </button>
      </header>

      {/* Visualizer (full screen) */}
      <main className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <Visualizer isActive={appState !== "idle"} />
      </main>

      {/* Bottom controls */}
      <footer className="absolute bottom-0 left-0 w-full flex flex-col items-center pb-8 md:pb-10 z-20 gap-4">
        {/* State message */}
        <div className="h-6">
          <AnimatePresence>
            {appState === "connecting" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex items-center gap-2 text-cyan-300/80 text-sm italic"
              >
                <Loader2 size={16} className="animate-spin" />
                Connecting...
              </motion.div>
            )}
            {appState === "listening" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex items-center gap-2 text-violet-300/80 text-sm italic"
              >
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                Listening...
              </motion.div>
            )}
            {appState === "speaking" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex items-center gap-2 text-pink-300/80 text-sm italic"
              >
                <span className="animate-pulse">Speaking...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls row - NOW WITH FILE UPLOAD */}
        <div className="flex items-center gap-3">
          {/* 🆕 File Upload Button */}
          <FileUploadButton
            disabled={appState === "idle"}
            onFileSelected={async (file) => {
              if (liveSessionRef.current) {
                await liveSessionRef.current.sendFile(file);
              }
            }}
          />

          {/* Power button */}
          <button
            onClick={toggleSession}
            className={`
              group relative flex items-center justify-center w-20 h-20 rounded-full
              transition-all duration-300 shadow-2xl pointer-events-auto
              ${
                appState !== "idle"
                  ? "bg-red-500/20 border-2 border-red-500/50 hover:bg-red-500/30"
                  : "bg-white/10 border-2 border-white/20 hover:bg-white/20 hover:scale-105"
              }
            `}
            aria-label={appState !== "idle" ? "End session" : "Start session"}
          >
            {appState !== "idle" ? (
              <MicOff size={32} />
            ) : (
              <Mic size={32} className="group-hover:animate-bounce" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

