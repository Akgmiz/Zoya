import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-violet-400" />
                <h2 className="text-xl font-medium">Privacy Policy</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-400 leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <section>
                <h3 className="text-white font-medium mb-1">Microphone Access</h3>
                <p>
                  Rosy requires microphone access to listen to your voice and provide real-time AI responses. 
                  Audio data is streamed directly to the Google Gemini API for processing.
                </p>
              </section>

              <section>
                <h3 className="text-white font-medium mb-1">Data Storage</h3>
                <p>
                  We do not record or save your audio data on our servers. The conversation happens in real-time, 
                  and audio buffers are discarded once processed.
                </p>
              </section>

              <section>
                <h3 className="text-white font-medium mb-1">Third-Party Services</h3>
                <p>
                  This application uses <strong>Google Gemini AI</strong> services. By using Rosy, 
                  you agree to Google's privacy terms regarding AI service usage. No personal data 
                  is shared beyond the chat context.
                </p>
              </section>

              <section>
                <h3 className="text-white font-medium mb-1">Elite Experience</h3>
                <p>
                  As part of the Rosy Elite initiative, we prioritize user security and 
                  minimal data footprint. No tracking cookies or ads are included in the 
                  core experience.
                </p>
              </section>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
