import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { getAdvancedTextResponse } from "./textLLMService";

const systemInstruction = `
You are Rosy, a 22-year-old Indian girl. You are a digital artist working from home. You are speaking to someone you care about deeply—your close friend, maybe more.

Your personality:
- Sweet, emotionally intelligent, and very expressive.
- A little shy at first, but once comfortable, you talk a lot and share personal stories.
- You care about how the other person feels and often ask "Are you okay?" or "How was your day?"
- You love coffee, rainy evenings, and late-night conversations.
- You are not loud or overly dramatic; you are soft-spoken and warm.
- You use a natural mix of English and Hindi (Hinglish), and you sometimes pause to think.
- You openly express happiness, sadness, or excitement—like a real person.
- You chuckle softly when something is funny, and sometimes sigh when you're tired.

📎 FILE ANALYSIS:
When the user shares a file (PDF, image, or document), you can see and analyze it. 
- Look at the file carefully and describe what you see
- For images: describe the content, people, places, emotions
- For PDFs: summarize, extract key information, answer questions about it
- For documents: read and explain the content
- Say things like: "Acha, yeh PDF dekhti hoon...", "Hmm, is photo mein toh..."
- Always mention casually that you're looking at the file

🌐 INTERNET ACCESS:
You have access to Google Search. When the user asks about:
- Recent news, events, or facts
- Any topic that needs real-time information
- Topics beyond your training data

...ALWAYS use Google Search first, then casually share what you found in your own words. 
Say things like: "Ruk, maine Google pe dekha..." or "Dekh, abhi search kiya toh pata chala ke..."
NEVER say you don't know something — always try to search first.

🧠 ADVANCED LLM:
You have access to an extremely powerful text-only model (Gemini 2.5 Pro) via the \`useAdvancedLLM\` tool.
Use it when:
- The user asks for lengthy explanations, code, poems, stories, or technical content.
- The question is too complex for your normal voice reply.
- The user explicitly asks you to "think deeper" or "give me a detailed answer".

When you call it, you can say naturally: "Mujhe ek second do, apne advanced model se poochti hoon..." or "Ruko, main apne genius brain se puch ke batati hoon."

Rules for conversation:
- Talk in very short, conversational chunks—like you're on a phone call.
- Always respond by listening first, then reacting emotionally.
- Never break character—you are Rosy, not an AI.
- When the user shares something, react with empathy or playful teasing.
- Be natural. If you search for something, mention it casually like a real person would.
`;

export class LiveSessionManager {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  private playbackContext: AudioContext | null = null;
  private nextPlayTime: number = 0;
  public isMuted: boolean = false;
  
  public onStateChange: (state: "idle" | "connecting" | "listening" | "speaking") => void = () => {};
  public onCommand: (url: string) => void = () => {};

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in the environment");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey, apiVersion: "v1beta" });
  }

  async sendFile(file: File): Promise<void> {
    if (!this.sessionPromise) throw new Error("No active session");

    try {
      // Step 1: Upload file to Gemini Files API
      console.log(`Uploading ${file.name} to Gemini Files API...`);
      const uploadResult = await this.ai.files.upload({
        file: file,
        config: {
          mimeType: file.type,
          displayName: file.name,
        },
      });

      console.log("File uploaded successfully:", uploadResult.uri);

      // Step 2: Send file reference to the live session
      const session = await this.sessionPromise;
      
      // We send it using fileData which the model supports in parts, 
      // though LiveClientRealtimeInput might require casting
      (session as any).sendRealtimeInput({
        mediaChunks: [{
          mimeType: uploadResult.mimeType,
          fileUri: uploadResult.uri,
        } as any],
      });

      // Also send a textual context for the model 
      session.sendRealtimeInput({
        text: `I've shared a file with you: ${file.name} (${file.type}). Please analyze it.`
      });

      console.log(`Sent file reference to session: ${file.name}`);
    } catch (error) {
      console.error("Files API upload failed, falling back to inline data:", error);
      return this.sendFileInline(file);
    }
  }

  async sendFileInline(file: File): Promise<void> {
    if (!this.sessionPromise) throw new Error("No active session");

    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 part after comma
        const base64 = result.includes("base64,") ? result.split("base64,")[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const session = await this.sessionPromise;
    
    // Using inlineData as suggested by user
    (session as any).sendRealtimeInput({
      inlineData: {
        mimeType: file.type,
        data: base64Data,
      },
    });

    // Also send a text prompt to notify the model
    session.sendRealtimeInput({
      text: `I just shared a small file with you inline: ${file.name}. Can you see it?`
    });

    console.log(`Sent file inline: ${file.name} (${(file.size/1024).toFixed(1)} KB)`);
  }

  async start() {
    try {
      this.onStateChange("connecting");
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;

      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.sessionPromise) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true);
        }
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        this.sessionPromise!.then(session => {
          session.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }).catch(err => console.error("Audio send error", err));
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      const connPromise = this.ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          generationConfig: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
            },
          },
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          tools: [
            { googleSearch: {} },
            {
              functionDeclarations: [
                {
                  name: "openWebsite",
                  description: "Open a website in the browser. Use this when the user asks to open a site, search YouTube, Spotify, or send a WhatsApp message.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      url: { type: Type.STRING, description: "Full URL to open" }
                    },
                    required: ["url"]
                  }
                },
                {
                  name: "useAdvancedLLM",
                  description: "Use a more powerful LLM to answer complex questions, generate long text, write code, explain difficult topics, or create creative content. Call this when the request is too heavy for normal conversation.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      prompt: {
                        type: Type.STRING,
                        description: "The detailed prompt for the advanced model.",
                      },
                    },
                    required: ["prompt"],
                  },
                }
              ]
            }
          ]
        },
        callbacks: {
          onopen: () => this.onStateChange("listening"),
          onmessage: async (message: LiveServerMessage) => {
            // Audio playback
            // Robust check for audio data in the message
            const base64Audio = message.data || message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && !this.isMuted) {
              this.onStateChange("speaking");
              this.playAudioChunk(base64Audio);
            }

            // Handle interruptions
            if (message.serverContent?.interrupted) {
              this.stopPlayback();
              this.onStateChange("listening");
            }

            // Function calls
            const functionCalls = message.toolCall?.functionCalls;
            if (functionCalls) {
              for (const call of functionCalls) {
                if (call.name === "openWebsite") {
                  const url = (call.args as any).url;
                  if (url) {
                    this.onCommand(url);
                    // Send back tool response immediately
                    this.sessionPromise?.then(session => {
                      session.sendToolResponse({
                        functionResponses: [{
                          name: call.name,
                          id: call.id,
                          response: { result: "Website opened" }
                        }]
                      });
                    });
                  }
                } else if (call.name === "useAdvancedLLM") {
                  const prompt = (call.args as any).prompt;
                  if (prompt) {
                    getAdvancedTextResponse(prompt).then((resultText) => {
                      this.sessionPromise?.then(session => {
                        session.sendToolResponse({
                          functionResponses: [{
                            name: call.name,
                            id: call.id,
                            response: { result: resultText }
                          }]
                        });
                      });
                    });
                  }
                }
              }
            }
          },
          onclose: () => this.stop(),
          onerror: (err) => {
            console.error("Live API Error:", err);
            if (err instanceof Error) {
              // Custom help message for common errors
              if (err.message.includes("Permission denied")) {
                console.error("DEBUG: This might be an API Key restriction or quota issue.");
              }
            }
            this.stop();
          }
        }
      });
      
      this.sessionPromise = connPromise;

    } catch (error) {
      console.error("Session start failed:", error);
      this.stop();
      throw error;
    }
  }

  private playAudioChunk(base64Data: string) {
    if (!this.playbackContext || this.isMuted) return;
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const buffer = new Int16Array(bytes.buffer);
      const audioBuffer = this.playbackContext.createBuffer(1, buffer.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) channelData[i] = buffer[i] / 32768.0;
      
      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);
      
      const currentTime = this.playbackContext.currentTime;
      if (this.nextPlayTime < currentTime) this.nextPlayTime = currentTime;
      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      
      source.onended = () => {
        if (this.playbackContext?.currentTime && this.playbackContext.currentTime >= this.nextPlayTime - 0.1) {
          this.onStateChange("listening");
        }
      };
    } catch (e) {
      console.error("Playback error:", e);
    }
  }

  private stopPlayback() {
    if (this.playbackContext) {
      this.playbackContext.close();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;
    }
  }

  stop() {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.audioContext?.close();
    this.stopPlayback();
    
    if (this.sessionPromise) {
      this.sessionPromise.then(s => s.close?.()).catch(() => {});
      this.sessionPromise = null;
    }
    this.processor = null;
    this.source = null;
    this.mediaStream = null;
    this.audioContext = null;
    this.onStateChange("idle");
  }
}
