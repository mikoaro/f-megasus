"use client";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { ExcavatorModel } from "@/components/ExcavatorModel";
import { TelemetryPanel } from "@/components/TelemetryPanel";
import { FleetCommand } from "@/components/FleetCommand";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WS_URL = API_URL.replace(/^http/, "ws").replace(/^https/, "wss");

type ViewMode = "FIELD" | "COMMAND";

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [demoMode, setDemoMode] = useState<"HUMAN" | "AI_AUTO">("HUMAN");
  const [agentDecision, setAgentDecision] = useState<any>(null);
  const [agentStatus, setAgentStatus] = useState<any>(null); 
  const [critical, setCritical] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("FIELD");
  const [userId, setUserId] = useState<string>("");
  const [cameraFeed, setCameraFeed] = useState<string | null>(null);

  useEffect(() => {
    let storedId = localStorage.getItem("aisn_user_id");
    if (!storedId) {
        storedId = uuidv4();
        localStorage.setItem("aisn_user_id", storedId);
    }
    setUserId(storedId);

    let ws: WebSocket;
    const connect = () => {
      ws = new WebSocket(`${WS_URL}/ws/telemetry`);
      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => setIsConnected(false);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === "DATA") {
              setTelemetry(msg.payload);
              if (msg.payload.state === "CRITICAL") setCritical(true);
          }
          if (msg.type === "EVENT" && msg.payload === "CRITICAL_FAULT") {
              setCritical(true);
              fetchVision();
          }
          if (msg.type === "AGENT_DECISION") setAgentDecision(msg.payload);
          
          if (msg.type === "AGENT_STATUS") {
              setAgentStatus(msg.payload);
          }

        } catch (e) {}
      };
    };
    connect();
    return () => { if (ws) ws.close(); };
  }, []);

  const fetchVision = async () => {
      try {
          const res = await fetch(`${API_URL}/api/vision/feed`);
          const data = await res.json();
          if (data.image_data) {
              setCameraFeed(data.image_data);
          }
      } catch (e) { console.error("Vision Fetch Error", e); }
  };

  // --- NEW: MODE TOGGLER ---
  const handleModeSwitch = (mode: "HUMAN" | "AI_AUTO") => {
      setDemoMode(mode);
      // Clear previous mode's data to act like a fresh view
      setAgentStatus(null);
      setAgentDecision(null);
  };

  const triggerFault = async () => {
    setCritical(true);
    setAgentDecision(null);
    setAgentStatus(null); 
    setCameraFeed(null); 
    try {
      await fetch(`${API_URL}/simulate/fault`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: demoMode, userId }),
      });
    } catch (err) { console.error(err); }
  };

  const resetSystem = async () => {
      try {
          await fetch(`${API_URL}/simulate/reset`, { method: "POST" });
          setCritical(false);
          setAgentDecision(null);
          setAgentStatus(null);
          setCameraFeed(null);
          const newId = uuidv4();
          localStorage.setItem("aisn_user_id", newId);
          setUserId(newId);
          window.location.reload();
      } catch (e) { console.error("Reset Failed", e); }
  }

  const isDerated = telemetry?.is_derated || false;
  const isHighRisk = (telemetry?.thermal_runaway_risk > 50); 
  const showRedAlert = (isHighRisk || critical) && !isDerated;
  const bgColor = showRedAlert ? "bg-red-950" : "bg-slate-900";

  let statusColor = "border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]";
  let statusText = "text-green-400";
  let statusLabel = "NORMAL MONITORING";
  let visionSrc = "/clean.jpg";

  if (isDerated) {
      statusColor = "border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]";
      statusText = "text-orange-400";
      statusLabel = "DERATING ACTIVE (COOLING)";
      visionSrc = "/clean.jpg";
  } else if (showRedAlert) {
      statusColor = "border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.8)] animate-pulse";
      statusText = "text-red-500";
      statusLabel = "HAZARD DETECTED";
      visionSrc = "/fire.jpg";
  }

  return (
    <div className={`min-h-screen flex flex-col ${bgColor} text-white relative overflow-hidden transition-colors duration-1000`}>
      
      <div className="z-50 w-full h-16 bg-black/90 border-b border-white/10 flex items-center justify-between px-6 backdrop-blur shadow-md">
        <div className="flex items-center gap-6">
            <h1 className="text-2xl font-mono font-bold text-yellow-400 tracking-widest">A.I.S.N.</h1>
            <div className="flex gap-1 bg-white/5 p-1 rounded">
                <button onClick={() => setViewMode("FIELD")} className={`px-4 py-1 text-xs font-mono rounded transition-colors ${viewMode === "FIELD" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>FIELD VIEW</button>
                <button onClick={() => setViewMode("COMMAND")} className={`px-4 py-1 text-xs font-mono rounded transition-colors ${viewMode === "COMMAND" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}>FLEET COMMAND</button>
            </div>
        </div>
        
        {/* --- UPDATED MODE BUTTONS --- */}
        <div className="flex items-center gap-2">
            <button 
                onClick={() => handleModeSwitch("HUMAN")} 
                className={`px-4 py-2 rounded font-mono text-xs border transition-all ${demoMode === "HUMAN" ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-transparent border-white/20 text-slate-400 hover:bg-white/5"}`}
            >
                Mode A: Human
            </button>
            <button 
                onClick={() => handleModeSwitch("AI_AUTO")} 
                className={`px-4 py-2 rounded font-mono text-xs border transition-all ${demoMode === "AI_AUTO" ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]" : "bg-transparent border-white/20 text-slate-400 hover:bg-white/5"}`}
            >
                Mode B: Auto
            </button>
        </div>
        
        <div className="flex items-center gap-4">
            <button onClick={triggerFault} className="px-4 py-2 bg-red-600 hover:bg-red-500 border border-red-400 text-white font-bold font-mono text-xs rounded shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse">! TRIGGER FAULT !</button>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            <div className="flex flex-col items-end">
                <span className="text-[9px] font-mono text-slate-500">SESSION ID</span>
                <span className="text-[10px] font-mono text-blue-300">{userId.slice(0,8)}...</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500"}`}></div>
            <button onClick={resetSystem} className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] text-slate-300 hover:bg-red-900/50 hover:text-red-200 font-mono rounded transition-colors">RESET</button>
        </div>
      </div>

      <div className="relative flex-1 w-full h-full">
        {viewMode === "FIELD" && (
            <>
                <div className="absolute inset-0 z-0">
                    <Canvas camera={{ position: [1, 0.5, 6], fov: 22 }} style={{ touchAction: 'none' }}>
                        <ambientLight intensity={0.5} />
                        <spotLight position={[10, 10, 10]} angle={0.15} />
                        
                        {/* UPDATED: Wrapped model in group to shift it down [x,y,z] */}
                        <group position={[0, -1.1, 0]}>
                           <ExcavatorModel telemetry={telemetry} />
                           <TelemetryPanel telemetry={telemetry} />
                        </group>

                        <Environment preset="city" />
                        <OrbitControls 
                            makeDefault 
                            enableDamping={true} 
                            dampingFactor={0.05}
                            enableZoom={true}
                            enableRotate={true}
                            minDistance={5}
                            maxDistance={20}
                            target={[0, 0, 0]} // Centers the camera rotation on the model
                        />
                    </Canvas>
                    {/* <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                        <ambientLight intensity={0.5} />
                        <spotLight position={[10, 10, 10]} angle={0.15} />
                        <ExcavatorModel telemetry={telemetry} />
                        <TelemetryPanel telemetry={telemetry} />
                        <Environment preset="city" />
                        <OrbitControls />
                    </Canvas> */}
                </div>
                
                {/* LIVE VISION HUD */}
                <div className={`absolute top-6 right-6 z-20 w-72 bg-black/80 rounded-lg overflow-hidden border-2 transition-all duration-500 ${statusColor}`}>
                    <div className="flex justify-between items-center px-3 py-1 bg-black/50 border-b border-white/10">
                        <span className={`text-[10px] font-bold font-mono ${statusText} tracking-wider animate-pulse`}>● LIVE FEED: CAM-01</span>
                        <span className="text-[9px] text-slate-500 font-mono">{statusLabel}</span>
                    </div>
                    <div className="relative w-full h-40 bg-slate-900">
                        <img src={visionSrc} alt="Live Vision Feed" className="w-full h-full object-cover opacity-90" />
                        { showRedAlert && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-24 border-2 border-red-500/80 shadow-[0_0_15px_rgba(220,38,38,0.6)] flex items-end justify-center pb-1">
                                <span className="text-[8px] bg-red-600 text-white px-1 font-mono">SMOKE DETECTED [99%]</span>
                            </div>
                        )}
                    </div>
                    <div className="px-3 py-2 grid grid-cols-2 gap-2 text-[9px] font-mono border-t border-white/10 bg-black/60">
                        <div><span className="text-slate-500 block">STATUS</span><span className={statusText}>{statusLabel}</span></div>
                        <div className="text-right"><span className="text-slate-500 block">CONFIDENCE</span><span className="text-blue-300">99.8%</span></div>
                    </div>
                </div>

                {/* <div className="absolute inset-0 z-10 p-8 pointer-events-none">
                    <div className="grid grid-cols-12 gap-6 mt-4 pointer-events-auto h-full items-end pb-8">
                        <div className="col-span-4"><TelemetryPanel telemetry={telemetry} /></div>
                    </div>
                </div> */}
            </>
        )}

        {viewMode === "COMMAND" && (
            <div className="p-8 h-full overflow-auto bg-slate-900/95">
                <FleetCommand 
                    telemetry={telemetry} 
                    agentDecision={agentDecision} 
                    agentStatus={agentStatus}
                    critical={critical} 
                    userId={userId}
                    demoMode={demoMode} // PASSING MODE PROP
                />
            </div>
        )}
      </div>
    </div>
  );
}