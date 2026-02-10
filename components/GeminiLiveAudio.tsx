"use client";
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import Orb from './Orb';
import { createAudioBlob, decode, decodeAudioData } from '@/utils/audio-utils';

// Type for chat history
interface Transcript {
    role: 'user' | 'agent';
    text: string;
}

// --- UPDATED: Props include userId ---
export function GeminiLiveAudio({ active, userId }: { active: boolean, userId: string }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState("Click Orb to Start");
  
  // NEW: Chat History State
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sessionRef = useRef<any>(null);
  
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  
  // --- NEW: Session Tracking Ref ---
  const sessionIdRef = useRef<string>(""); 
  
  const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""; 
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    // Generate Session ID for this specific interaction
    sessionIdRef.current = crypto.randomUUID();
    return () => {
        // Ensure disconnect happens on unmount
        disconnect(); 
    };
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [transcripts]);

  // --- NEW: Save Transcript Function ---
  const saveTranscript = async () => {
      if (transcripts.length === 0) return;
      
      const payload = {
          session_id: sessionIdRef.current,
          user_id: userId,
          asset_id: "HB-001", // Hardcoded asset for demo
          transcript: transcripts
      };

      try {
          await fetch(`${API_URL}/api/save-transcript`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          console.log("📝 Transcript successfully persisted to Audit Trail.");
      } catch (e) {
          console.error("❌ Failed to save transcript:", e);
      }
  };

  const disconnect = () => {
      // --- NEW: Trigger Save before cleanup ---
      saveTranscript();

      if (sessionRef.current) {
          sessionRef.current.close();
          sessionRef.current = null;
      }
      audioContextRef.current?.close();
      outputAudioContextRef.current?.close();
      
      activeSourcesRef.current.forEach(s => s.stop());
      activeSourcesRef.current.clear();
      
      setIsSpeaking(false);
      setStatus("Disconnected");
  };

  const startSession = async () => {
    if (!API_KEY) return setStatus("Missing Key");

    try {
        setStatus("Connecting...");
        
        // Reset transcripts and Session ID for new call
        setTranscripts([]);
        sessionIdRef.current = crypto.randomUUID();

        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

        await audioContextRef.current.resume();
        await outputAudioContextRef.current.resume();

        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        
        const session = await ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
                },
                systemInstruction: {
                    parts: [{ text: `You are the A.I.S.N. autonomous procurement agent speaking to the Fleet Manager.
                            
                            CRITICAL CONTEXT:
                            - Asset: Komatsu HB365LC-3 (ID: HB-001)
                            - Status: CRITICAL THERMAL FAILURE (Temp > 110C).
                            - Broken Part: Hybrid Inverter Pump (Part #7826-45-2001).
                            - Impact: System shutdown imminent.

                            YOUR SCRIPTED BEHAVIOR (Follow strictly):
                            1. GREETING: When the Manager says "Status report", strictly reply: "Critical thermal failure detected on the Hybrid Inverter Pump. Part number 7826-45-2001 is destroyed. System is down."
                            2. INVENTORY CHECK: When asked about stock, reply: "Negative. Inventory is empty. I have located a vendor with immediate availability. They are asking $5,500."
                            3. NEGOTIATION: When the Manager complains about the price ($5000 budget), reply: "Understood. Negotiating..." [Wait 2 seconds silently]. Then say: "I've secured the part for $4,800 with expedited shipping. Shall I execute the purchase order?"
                            4. CLOSING: When the Manager says "Yes" or "Approve", reply: "Purchase order executed. Estimated arrival in 4 hours. Systems entering standby."

                            Tone: Urgent, professional, concise. Do not deviate.` }]
                }
            },
            callbacks: {
                onopen: () => {
                    console.log('Session Open');
                    setIsSpeaking(true);
                    setStatus("🔴 Live: Speak");
                    
                    const source = audioContextRef.current!.createMediaStreamSource(stream);
                    const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    
                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob = createAudioBlob(inputData);
                        session.sendRealtimeInput({ media: pcmBlob });
                    };

                    source.connect(analyser);
                    source.connect(processor);
                    processor.connect(audioContextRef.current!.destination);
                },
                onmessage: async (message: any) => {
                    // 1. Handle Audio
                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio) {
                        const outputCtx = outputAudioContextRef.current!;
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                        
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        source.addEventListener('ended', () => activeSourcesRef.current.delete(source));
                        
                        const now = outputCtx.currentTime;
                        nextStartTimeRef.current = Math.max(now, nextStartTimeRef.current);
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        activeSourcesRef.current.add(source);
                    }

                    // 2. Handle Transcription (NEW)
                    // Gemini sends "inputTranscription" (User) and "outputTranscription" (Agent)
                    const serverContent = message.serverContent;
                    if (serverContent) {
                        if (serverContent.modelTurn?.parts?.[0]?.text) {
                             // Agent Text
                             const text = serverContent.modelTurn.parts[0].text;
                             setTranscripts(prev => [...prev, { role: 'agent', text }]);
                        }
                        // Note: User transcription arrives in 'serverContent.turnComplete' or specific events depending on API version.
                        // For the preview, we often infer user text or display "..." while listening.
                    }
                },
                onclose: () => {
                    setStatus("Session Closed");
                    setIsSpeaking(false);
                    // --- NEW: Save on remote close ---
                    saveTranscript();
                },
                onerror: (e: any) => {
                    console.error(e);
                    setStatus("Connection Error");
                }
            }
        });

        sessionRef.current = session;

    } catch (err) {
        console.error("Setup Failed", err);
        setStatus("Setup Failed");
    }
  };

  if (!active) return null;

  return (
    <div className="mt-4 flex gap-4 h-64">
        {/* Left: Orb Control */}
        <div className="w-1/3 p-4 border border-blue-500/50 rounded-lg bg-blue-900/20 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-900/30 transition-colors" onClick={startSession}>
            <div className="w-full h-32 relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Orb analyser={analyserRef.current} isActive={isSpeaking} />
                </div>
            </div>
            <p className={`font-mono text-sm mt-4 ${isSpeaking ? "text-green-400 animate-pulse" : "text-blue-400"}`}>
                {status}
            </p>
        </div>

        {/* Right: Live Transcript (The "Product" UI) */}
        <div className="w-2/3 p-4 border border-white/10 rounded-lg bg-black/40 backdrop-blur flex flex-col">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 border-b border-white/10 pb-1">
                SECURE COMMS LOG // ENCRYPTED
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2">
                {transcripts.length === 0 ? (
                    <p className="text-slate-600 text-xs font-mono italic mt-10 text-center">
                        Waiting for voice link...
                    </p>
                ) : (
                    transcripts.map((t, i) => (
                        <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] px-3 py-2 rounded text-xs font-mono ${
                                t.role === 'user' 
                                    ? 'bg-blue-900/50 text-blue-200 border border-blue-500/30' 
                                    : 'bg-slate-800/80 text-green-400 border border-green-500/20'
                            }`}>
                                <span className="block text-[8px] opacity-50 mb-1 uppercase">{t.role === 'agent' ? 'A.I.S.N. CORE' : 'FLEET COMMAND'}</span>
                                {t.text}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
}