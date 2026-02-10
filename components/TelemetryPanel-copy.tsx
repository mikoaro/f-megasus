import React from 'react';

export function TelemetryPanel({ telemetry }: { telemetry: any }) {
  if (!telemetry) return (
    <div className="p-6 bg-black/60 rounded-xl border border-white/10 backdrop-blur animate-pulse">
        <p className="text-slate-500 font-mono text-xs">ESTABLISHING UPLINK...</p>
    </div>
  );

  // --- LOGIC: Dynamic Status Colors ---
  // If Derated (Safety Active) -> Green/Orange (Stabilizing)
  // If Critical & Not Derated -> Red (Danger)
  // Else -> Normal (Blue/Green)
  
  const isCritical = telemetry.state === "CRITICAL";
  const isDerated = telemetry.is_derated;

  const getStatusColor = (val: number, threshold: number) => {
      if (isDerated) return "text-orange-400"; // Stabilizing
      if (val > threshold) return "text-red-500 animate-pulse"; // Danger
      return "text-green-400"; // Normal
  };

  return (
    <div className="bg-black/60 rounded-xl border border-white/10 backdrop-blur overflow-hidden font-mono">
      {/* HEADER */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
        <div>
            <h2 className="text-lg text-blue-400 font-bold">{telemetry.asset_id}</h2>
            <p className="text-[10px] text-slate-500">HB365LC-3 HYBRID EXCAVATOR</p>
        </div>
        <div className={`px-3 py-1 rounded text-xs font-bold border ${isCritical ? (isDerated ? "border-orange-500 text-orange-400 bg-orange-900/20" : "border-red-500 text-red-500 bg-red-900/20") : "border-green-500 text-green-400 bg-green-900/20"}`}>
            {isDerated ? "LIMP MODE ACTIVE" : telemetry.state}
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="p-6 grid grid-cols-2 gap-6">
        
        {/* CORE TEMP */}
        <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase">Core Temp (Inverter)</p>
            <p className={`text-3xl font-bold ${getStatusColor(telemetry.core_temp_c, 90)}`}>
                {telemetry.core_temp_c}°C
            </p>
            {/* Visual Bar */}
            <div className="w-full h-1 bg-slate-800 rounded overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${telemetry.core_temp_c > 90 ? "bg-red-500" : "bg-blue-500"}`} 
                    style={{ width: `${Math.min(100, (telemetry.core_temp_c / 120) * 100)}%` }}
                ></div>
            </div>
        </div>

        {/* THERMAL RUNAWAY RISK */}
        <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase">Thermal Runaway Risk</p>
            <p className={`text-3xl font-bold ${getStatusColor(telemetry.thermal_runaway_risk, 50)}`}>
                {telemetry.thermal_runaway_risk}%
            </p>
             {/* Visual Bar */}
             <div className="w-full h-1 bg-slate-800 rounded overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${telemetry.thermal_runaway_risk > 50 ? "bg-red-500" : "bg-green-500"}`} 
                    style={{ width: `${telemetry.thermal_runaway_risk}%` }}
                ></div>
            </div>
        </div>

        {/* CAPACITOR CURRENT */}
        <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase">Capacitor Current</p>
            <p className={`text-2xl font-bold text-white`}>
                {telemetry.capacitor_current} A
            </p>
        </div>

        {/* DERATE STATUS */}
        <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase">Derate Mode</p>
            <p className={`text-xl font-bold ${isDerated ? "text-blue-400" : "text-slate-600"}`}>
                {isDerated ? "ENGAGED" : "IDLE"}
            </p>
            <p className="text-[9px] text-slate-500">
                Limit: {isDerated ? "1200 RPM" : "NO LIMIT"}
            </p>
        </div>

      </div>
    </div>
  );
}