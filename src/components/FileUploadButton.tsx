import React, { useRef, useState } from "react";
import { Paperclip, Loader2, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FileUploadButtonProps {
  onFileSelected: (file: File) => Promise<void>;
  disabled?: boolean;
}

export default function FileUploadButton({ onFileSelected, disabled }: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate types
    const allowed = [
      "application/pdf", "image/png", "image/jpeg", "image/webp",
      "text/plain", "text/csv", "application/rtf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (!allowed.includes(file.type)) {
      setStatus({ type: 'error', msg: 'Unsupported file type' });
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    // Size limit: ~15 MB reasonable for inline (total request limit is 100MB but we play safe)
    if (file.size > 15 * 1024 * 1024) {
      setStatus({ type: 'error', msg: 'File too large (max 15MB)' });
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    setUploading(true);
    setStatus(null);
    try {
      await onFileSelected(file);
      setStatus({ type: 'success', msg: `Sent: ${file.name}` });
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      console.error("Upload failed:", err);
      setStatus({ type: 'error', msg: 'Failed to send file' });
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      <AnimatePresence>
        {status && (
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`text-xs hidden md:block ${status.type === 'error' ? 'text-red-400' : 'text-green-400'}`}
          >
            {status.type === 'success' ? <CheckCircle size={12} className="inline mr-1" /> : <XCircle size={12} className="inline mr-1" />}
            {status.msg}
          </motion.span>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.rtf,.doc,.docx"
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
        className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shadow-2xl disabled:opacity-50"
        title="Send a file to Rosy"
      >
        {uploading ? (
          <Loader2 size={18} className="animate-spin opacity-70" />
        ) : (
          <Paperclip size={18} className="opacity-70" />
        )}
      </button>
    </div>
  );
}
