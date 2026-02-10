import React, { useEffect, useRef, useState } from 'react';

export function AgentTerminal({ decision, statusStream }: { decision: any, statusStream: any }) {
    const [logs, setLogs] = useState<any[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    // --- NEW: TEXT-TO-SPEECH ENGINE ---
    const speakLog = (status: string, text: string) => {
        if (!window.speechSynthesis) return;

        // Cancel previous speech to prevent overlap queues
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // --- VOICE PERSONAS ---
        if (status === "INBOUND_OFFER") {
            // VENDOR AGENT (Distinct Voice)
            utterance.pitch = 0.8; // Lower pitch
            utterance.rate = 0.9;  // Slightly slower
        } else {
            // MARATHON AGENT (Standard Voice)
            utterance.pitch = 1.1; // Higher pitch
            utterance.rate = 1.1;  // Faster, urgent
        }

        // Clean up text for better speech (remove identifiers)
        utterance.text = text.replace("URGENT:", "").replace("OFFER:", "").replace("AUTO-APPROVAL:", "");
        
        window.speechSynthesis.speak(utterance);
    };

    // Append new status messages to log & SPEAK THEM
    useEffect(() => {
        if (statusStream) {
            setLogs(prev => [...prev, { ...statusStream, time: new Date().toLocaleTimeString() }]);
            
            // Trigger Audio for Negotiation Steps
            if (["NEGOTIATING", "OUTBOUND_REQ", "INBOUND_OFFER", "PURCHASE_EXEC", "SAFETY_INTERLOCK"].includes(statusStream.status)) {
                speakLog(statusStream.status, statusStream.context);
            }
        }
    }, [statusStream]);

    // Scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="bg-black/80 rounded border border-white/10 h-48 overflow-hidden flex flex-col font-mono text-xs">
            <div className="bg-white/5 p-2 border-b border-white/10 flex justify-between">
                <span className="text-slate-400">COMMAND LOG</span>
                <div className="flex gap-2">
                    {/* Visual Indicator for Audio */}
                    <span className="text-[10px] text-slate-500">AUDIO ACTIVE</span>
                    <span className="text-[10px] text-green-500 animate-pulse">● LIVE</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {logs.length === 0 && <span className="text-slate-600 italic">Waiting for fault trigger...</span>}
                
                {logs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                        <span className="text-slate-600">[{log.time}]</span>
                        <div>
                            <span className={`font-bold mr-2 ${getColor(log.status)}`}>{log.status}:</span>
                            <span className="text-slate-300">{log.context}</span>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}

function getColor(status: string) {
    if (status === "SAFETY_INTERLOCK") return "text-red-500";
    if (status === "NEGOTIATING" || status === "OUTBOUND_REQ") return "text-purple-400";
    if (status === "INBOUND_OFFER") return "text-yellow-400";
    if (status === "PURCHASE_EXEC" || status === "COMPLETE") return "text-green-400";
    return "text-blue-400";
}