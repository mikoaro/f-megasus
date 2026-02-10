import React, { useState } from 'react';
import { AgentTerminal } from "@/components/AgentTerminal";
import { GeminiLiveAudio } from "@/components/GeminiLiveAudio";

interface FleetCommandProps {
    telemetry: any;
    agentDecision: any;
    critical: boolean;
    userId: string;
}

export function FleetCommand({ telemetry, agentDecision, critical, userId }: FleetCommandProps) {
    
    const hef = telemetry?.hef_score || 100;
    const invData = agentDecision?.inventory_check;
    const ticketData = agentDecision?.ticket;
    
    const [visionResult, setVisionResult] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);

    const runVisionCheck = async () => {
        setIsScanning(true);
        // Simulation for now
        setTimeout(() => {
            setVisionResult({ clean: true, hazard: "NONE", confidence: 0.98 });
            setIsScanning(false);
        }, 2000);
    };

    const getHealthColor = (score: number) => score < 50 ? "text-red-500 font-bold" : score < 80 ? "text-yellow-400" : "text-green-400";

    return (
        <div className="grid grid-cols-12 gap-6 h-full font-mono">
            {/* LEFT COL: ASSET HEALTH & TICKETS */}
            <div className="col-span-7 space-y-6">
                
                {/* HEF DASHBOARD */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-500"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    </div>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl text-blue-300 font-bold tracking-widest">FLEET HEALTH</h2>
                            <p className="text-xs text-slate-500 mt-1">REAL-TIME EFFICIENCY FACTOR</p>
                        </div>
                        <div className="text-right">
                            <span className={`text-5xl font-bold ${hef < 45 ? "text-red-500 animate-pulse" : "text-green-400"}`}>{hef}%</span>
                        </div>
                    </div>
                    
                    {critical && (
                        <div className="mb-6 bg-red-900/20 border border-red-500/30 p-3 rounded flex items-center justify-center gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                            <span className="text-red-300 text-xs font-bold tracking-wider">ACTIVE DERATING: TORQUE 70% | RPM 1200</span>
                        </div>
                    )}

                    <div className="grid grid-cols-4 gap-4 text-center">
                        <HealthStat label="CAPACITOR" score={telemetry?.cap_health || 100} />
                        <HealthStat label="INVERTER" score={telemetry?.inv_health || 100} alert={critical} />
                        <HealthStat label="HYD. PUMP" score={telemetry?.pump_health || 100} />
                        <HealthStat label="HYD. VALVE" score={telemetry?.valve_health || 100} />
                    </div>
                </div>

                {/* TICKET MANAGEMENT */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-6 h-64 overflow-hidden flex flex-col">
                    <h2 className="text-sm text-slate-400 mb-4 border-b border-white/10 pb-2">CRM: INCIDENT TICKETS</h2>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="text-slate-500">
                                <tr><th>TICKET ID</th><th>STATUS</th><th>COMPONENT</th><th>PRIORITY</th><th>CREATED</th></tr>
                            </thead>
                            <tbody className="text-slate-300 divide-y divide-white/5">
                                {ticketData ? (
                                    <tr className="bg-red-500/10">
                                        <td className="py-3 font-mono text-blue-400">#{ticketData.ticket_id}</td>
                                        <td className="py-3 text-red-400 font-bold animate-pulse">{ticketData.status}</td>
                                        <td className="py-3">Hybrid Inverter Pump</td>
                                        <td className="py-3"><span className="bg-red-900 text-red-200 px-2 py-1 rounded">P1</span></td>
                                        <td className="py-3 text-slate-500">Just now</td>
                                    </tr>
                                ) : (
                                    <tr><td colSpan={5} className="py-8 text-center text-slate-600 italic">No active incidents detected.</td></tr>
                                )}
                                <tr className="opacity-40 hover:opacity-100 transition-opacity">
                                    <td className="py-3 text-blue-400">#INC-8821</td>
                                    <td className="py-3 text-green-500">RESOLVED</td>
                                    <td className="py-3">Hydraulic Filter</td>
                                    <td className="py-3">P3</td>
                                    <td className="py-3 text-slate-500">2 days ago</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* RIGHT COL: COMMAND CENTER (AGENT & TOOLS) */}
            <div className="col-span-5 space-y-6 flex flex-col">
                
                {/* 1. AGENT INTERFACE (MOVED HERE) */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm text-purple-400 font-bold tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            AI COMMAND LINK
                        </h2>
                        {critical && <span className="text-[10px] bg-red-500 text-black px-2 py-0.5 rounded font-bold animate-pulse">ACTION REQUIRED</span>}
                    </div>
                    
                    <div className="mb-4">
                        <AgentTerminal decision={agentDecision} />
                    </div>

                    <div className="mt-auto">
                        {(critical || agentDecision) ? (
                            <GeminiLiveAudio active={true} userId={userId} />
                        ) : (
                            <div className="h-16 flex items-center justify-center border border-white/5 rounded bg-white/5 text-slate-600 text-xs italic">
                                Agent Standby - Waiting for Trigger
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. ERP & VISION TOOLS */}
                <div className="grid grid-cols-2 gap-4">
                    {/* ERP STATUS */}
                    <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                        <h2 className="text-[10px] text-slate-500 mb-2 uppercase">ERP: Inventory</h2>
                        <div className="text-xs">
                            <div className="flex justify-between mb-1">
                                <span className="text-slate-400">PART #7826</span>
                                <span className={invData?.available ? "text-green-400" : "text-red-500 font-bold"}>
                                    {invData ? (invData.available ? "IN STOCK" : "0 UNITS") : "--"}
                                </span>
                            </div>
                            {invData && !invData.available && (
                                <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded text-yellow-500">
                                    VENDOR QUOTE<br/>
                                    <span className="text-white font-bold">$5,500.00</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* VISION TOOL */}
                    <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                        <h2 className="text-[10px] text-slate-500 mb-2 uppercase">Vision Safety</h2>
                        <div className="flex-1 flex items-center justify-center bg-black/50 rounded mb-2">
                            {visionResult ? (
                                <span className={`text-lg font-bold ${visionResult.clean ? "text-green-500" : "text-red-500"}`}>
                                    {visionResult.clean ? "CLEAN" : "HAZARD"}
                                </span>
                            ) : (
                                <span className="text-xs text-slate-600">NO FEED</span>
                            )}
                        </div>
                        <button 
                            onClick={runVisionCheck} 
                            disabled={isScanning}
                            className="w-full py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-300 text-[10px] rounded transition-colors"
                        >
                            {isScanning ? "SCANNING..." : "SCAN AREA"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HealthStat({ label, score, alert }: { label: string, score: number, alert?: boolean }) {
    const color = score < 50 ? "text-red-500" : score < 80 ? "text-yellow-400" : "text-green-400";
    return (
        <div className={`p-3 bg-slate-900/50 rounded border ${alert ? "border-red-500 bg-red-900/10" : "border-white/5"}`}>
            <p className="text-[10px] text-slate-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{score}%</p>
        </div>
    );
}