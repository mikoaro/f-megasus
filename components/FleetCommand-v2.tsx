import React, { useEffect, useState } from 'react';
import { AgentTerminal } from "@/components/AgentTerminal";
import { GeminiLiveAudio } from "@/components/GeminiLiveAudio";

// --- TYPES FOR SYSTEM OF RECORD ---
interface Ticket {
    ticket_ref: string;
    issue_type: string;
    created_at: string;
    priority: string;
}

interface InventoryItem {
    part_number: string;
    name: string;
    stock_level: number;
}

interface Dispatch {
    work_order_ref: string;
    technician_name: string;
    destination: string;
    eta: string;
    created_at: string;
}

interface FleetCommandProps {
    telemetry: any;
    agentDecision: any;
    critical: boolean;
    userId: string;
}

export function FleetCommand({ telemetry, agentDecision, critical, userId }: FleetCommandProps) {
    // --- 1. EXISTING STATE (Fleet Health & AI) ---
    const hef = telemetry?.hef_score || 100;
    const invData = agentDecision?.inventory_check; // From Agent Decision (Live)
    
    const [visionResult, setVisionResult] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);

    // --- 2. NEW STATE (System of Records Tables) ---
    const [sorTickets, setSorTickets] = useState<Ticket[]>([]);
    const [sorInventory, setSorInventory] = useState<InventoryItem[]>([]);
    const [sorDispatches, setSorDispatches] = useState<Dispatch[]>([]);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    // --- 3. VISION SIMULATION ---
    const runVisionCheck = async () => {
        setIsScanning(true);
        setTimeout(() => {
            setVisionResult({ clean: true, hazard: "NONE", confidence: 0.98 });
            setIsScanning(false);
        }, 2000);
    };

    // --- 4. DATA POLLING (System of Records) ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resTickets, resInv, resDisp] = await Promise.all([
                    fetch(`${API_URL}/api/crm/tickets`),
                    fetch(`${API_URL}/api/erp/inventory`),
                    fetch(`${API_URL}/api/fsm/dispatches`)
                ]);
                
                if(resTickets.ok) setSorTickets(await resTickets.json());
                if(resInv.ok) setSorInventory(await resInv.json());
                if(resDisp.ok) setSorDispatches(await resDisp.json());
            } catch (e) {
                console.error("Failed to fetch SOR data", e);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [API_URL]);

    // Helper for timestamps
    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // Component helper for Health stats
    const HealthStat = ({ label, score, alert }: { label: string, score: number, alert?: boolean }) => {
        const color = score < 50 ? "text-red-500" : score < 80 ? "text-yellow-400" : "text-green-400";
        return (
            <div className={`p-3 bg-slate-900/50 rounded border ${alert ? "border-red-500 bg-red-900/10" : "border-white/5"}`}>
                <p className="text-[10px] text-slate-500 mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{score}%</p>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 h-full font-mono text-xs overflow-y-auto">
            
            {/* =====================================================================================
                SECTION 1: REAL-TIME OPERATIONS (Original Layout Preserved)
               ===================================================================================== */}
            <div className="grid grid-cols-12 gap-6">
                
                {/* LEFT: FLEET HEALTH */}
                <div className="col-span-7 bg-black/40 border border-white/10 rounded-xl p-6 relative overflow-hidden">
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

                {/* RIGHT: AI COMMAND & TOOLS */}
                <div className="col-span-5 space-y-6 flex flex-col">
                    {/* AGENT TERMINAL */}
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
                                <div className="h-12 flex items-center justify-center border border-white/5 rounded bg-white/5 text-slate-600 text-xs italic">
                                    Agent Standby - Waiting for Trigger
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TOOLS: ERP & VISION */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* ERP Live Check */}
                        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                            <h2 className="text-[10px] text-slate-500 mb-2 uppercase">ERP: Inventory Check</h2>
                            <div className="text-xs">
                                <div className="flex justify-between mb-1">
                                    <span className="text-slate-400">PART #7826</span>
                                    <span className={invData?.available ? "text-green-400" : "text-red-500 font-bold"}>
                                        {invData ? (invData.available ? "IN STOCK" : "0 UNITS") : "--"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Vision Safety */}
                        <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                            <h2 className="text-[10px] text-slate-500 mb-2 uppercase">Vision Safety</h2>
                            <div className="flex justify-between items-center">
                                {visionResult ? (
                                    <span className={`text-sm font-bold ${visionResult.clean ? "text-green-500" : "text-red-500"}`}>
                                        {visionResult.clean ? "CLEAN" : "HAZARD"}
                                    </span>
                                ) : (
                                    <span className="text-xs text-slate-600">NO FEED</span>
                                )}
                                <button 
                                    onClick={runVisionCheck} 
                                    disabled={isScanning}
                                    className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-300 text-[10px] rounded transition-colors"
                                >
                                    {isScanning ? "SCAN..." : "SCAN"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* =====================================================================================
                SECTION 2: SYSTEM OF RECORDS (New Extension)
               ===================================================================================== */}
            
            <div className="grid grid-cols-3 gap-6 h-64">
                
                {/* COLUMN 1: CRM (Tickets) */}
                <div className="flex flex-col bg-black/40 border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-white/10 bg-white/5 flex items-center gap-2">
                        <span className="text-red-400">📄</span>
                        <h3 className="font-bold text-slate-200">CASE MANAGEMENT (CRM)</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {sorTickets.map((t) => (
                            <div key={t.ticket_ref} className="bg-slate-900/80 border-l-2 border-red-500 p-3 rounded">
                                <div className="flex justify-between mb-1">
                                    <span className="text-red-400 font-bold">{t.ticket_ref}</span>
                                    <span className="text-slate-500">{formatTime(t.created_at)}</span>
                                </div>
                                <p className="text-white font-medium">{t.issue_type}</p>
                                <div className="flex justify-between mt-1">
                                    <span className="text-slate-500">Priority: {t.priority}</span>
                                    <span className="text-slate-500">Status: OPEN</span>
                                </div>
                            </div>
                        ))}
                        {sorTickets.length === 0 && <p className="text-slate-600 text-center mt-10 italic">No Active Cases</p>}
                    </div>
                </div>

                {/* COLUMN 2: ERP (Inventory Logs) */}
                <div className="flex flex-col bg-black/40 border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-white/10 bg-white/5 flex items-center gap-2">
                        <span className="text-purple-400">📦</span>
                        <h3 className="font-bold text-slate-200">INVENTORY LOGS (ERP)</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {sorInventory.map((i) => (
                            <div key={i.part_number} className={`bg-slate-900/80 border-l-2 p-3 rounded flex justify-between items-center ${i.stock_level > 0 ? 'border-purple-500' : 'border-slate-600 opacity-50'}`}>
                                <div>
                                    <div className="text-purple-300 font-bold mb-1">{i.part_number}</div>
                                    <div className="text-white text-[10px]">{i.name}</div>
                                </div>
                                <div className={`px-2 py-1 rounded text-[10px] font-bold ${i.stock_level > 0 ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                                    {i.stock_level > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
                                </div>
                            </div>
                        ))}
                        {sorInventory.length === 0 && <p className="text-slate-600 text-center mt-10 italic">Loading ERP Data...</p>}
                    </div>
                </div>

                {/* COLUMN 3: FSM (Field Service) */}
                <div className="flex flex-col bg-black/40 border border-white/10 rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-white/10 bg-white/5 flex items-center gap-2">
                        <span className="text-green-400">🚚</span>
                        <h3 className="font-bold text-slate-200">FIELD SERVICE (FSM)</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {sorDispatches.map((d) => (
                            <div key={d.work_order_ref} className="bg-slate-900/80 border-l-2 border-green-500 p-3 rounded">
                                <div className="flex justify-between mb-1">
                                    <span className="text-green-400 font-bold">{d.work_order_ref}</span>
                                    <span className="text-slate-500">{formatTime(d.created_at)}</span>
                                </div>
                                <p className="text-white font-bold text-sm">{d.technician_name}</p>
                                <p className="text-slate-400">Dest: {d.destination}</p>
                                <div className="mt-2 flex justify-between items-center">
                                    <span className="bg-green-900/30 text-green-300 px-2 py-0.5 rounded">EN ROUTE</span>
                                    <span className="text-slate-500">ETA: {d.eta}</span>
                                </div>
                            </div>
                        ))}
                        {sorDispatches.length === 0 && <p className="text-slate-600 text-center mt-10 italic">No Active Dispatches</p>}
                    </div>
                </div>

            </div>
        </div>
    );
}