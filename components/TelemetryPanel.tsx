import React from "react";
import { Html } from "@react-three/drei";

export function TelemetryPanel({ telemetry }: { telemetry: any }) {
  if (!telemetry)
    return (
      <Html position={[5, 3, 0]} center distanceFactor={18}>
        <div className="p-6 bg-black/60 rounded-xl border border-white/10 backdrop-blur animate-pulse">
          <p className="text-slate-500 font-mono text-xs">
            ESTABLISHING UPLINK...
          </p>
        </div>
      </Html>
    );

  // --- DYNAMIC COLOR LOGIC (YOUR ORIGINAL) ---
  const getStatusColor = (
    val: number,
    warnThreshold: number,
    critThreshold: number,
  ) => {
    if (val >= critThreshold)
      return "text-red-500 font-extrabold animate-pulse";
    if (val >= warnThreshold) return "text-orange-400 font-bold";
    return "text-green-400 font-medium";
  };

  const getBarColor = (
    val: number,
    warnThreshold: number,
    critThreshold: number,
  ) => {
    if (val >= critThreshold) return "bg-red-500";
    if (val >= warnThreshold) return "bg-orange-500";
    return "bg-green-500";
  };

  const isDerated = telemetry.is_derated;
  const stateColor =
    telemetry.state === "CRITICAL"
      ? isDerated
        ? "border-orange-500 text-orange-400 bg-orange-900/20"
        : "border-red-500 text-red-500 bg-red-900/20"
      : "border-green-500 text-green-400 bg-green-900/20";

  return (
    <Html position={[1, 1.5, 0]} center distanceFactor={2.1}>
      <div className="p-4 font-mono text-xs rounded-md shadow-2xl pointer-events-none bg-slate-900/90 backdrop-blur-md min-w-100 border border-slate-700/50">
        {/* HEADER (YOUR ORIGINAL LABELS) */}
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700/50">
          <div>
            <h2 className="text-sm text-blue-400 font-bold tracking-wider">
              {telemetry.asset_id}
            </h2>
            <p className="text-[10px] text-slate-500">
              HB365LC-3 HYBRID EXCAVATOR
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded text-[9px] font-bold border ${stateColor} transition-colors duration-500`}
          >
            {isDerated ? "LIMP MODE ACTIVE" : telemetry.state}
          </div>
        </div>

        {/* METRICS GRID (YOUR ORIGINAL DATA) */}
        <div className="space-y-6">
          {/* CORE TEMP */}
          <div className="space-y-1 flex justify-between gap-20">
            <p className="text-[15px] text-slate-500 uppercase font-bold tracking-widest">
              Core Temp (Inverter)
            </p>
            <div className="w-30 items-end flex flex-col">
              <p
                className={`text-2xl transition-colors duration-300 ${getStatusColor(telemetry.core_temp_c, 75, 95)}`}
              >
                {telemetry.core_temp_c}°C
              </p>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all duration-300 ${getBarColor(telemetry.core_temp_c, 75, 95)}`}
                  style={{
                    width: `${Math.min(100, (telemetry.core_temp_c / 120) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* THERMAL RISK */}
          <div className="space-y-1 flex justify-between gap-20">
            <p className="text-[15px] text-slate-500 uppercase font-bold tracking-widest">
              Thermal Runaway Risk
            </p>
            <div className="w-30 items-end flex flex-col">
                  <p
              className={`text-2xl transition-colors duration-300 ${getStatusColor(telemetry.thermal_runaway_risk, 30, 60)}`}
            >
              {telemetry.thermal_runaway_risk}%
            </p>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 ${getBarColor(telemetry.thermal_runaway_risk, 30, 60)}`}
                style={{ width: `${telemetry.thermal_runaway_risk}%` }}
              ></div>
            </div>
            </div>
            
          </div>

          {/* LOWER METRICS (CAPACITOR & ENGINE) */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1 flex justify-between gap-20">
              <p className="text-[15px] text-slate-500 uppercase font-bold tracking-widest">
                Capacitor Current
              </p>
              <p
                className={`text-lg transition-colors duration-300 ${getStatusColor(telemetry.capacitor_current, 70, 100)}`}
              >
                {telemetry.capacitor_current} A
              </p>
            </div>

            <div className="space-y-1 flex justify-between gap-20">
              <p className="text-[15px] text-slate-500 uppercase font-bold tracking-widest">
                Engine Status
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold ${isDerated ? "text-orange-400" : "text-slate-200"}`}
                >
                  {isDerated ? "DERATED" : `${telemetry.rpm} RPM`}
                </span>
              </div>
            </div>
          </div>

          {/* TORQUE FOOTER */}
          <div className="pt-2 flex justify-between items-center text-[9px] text-slate-500 border-t border-white/5">
            <p className="text-[15px] text-slate-500 uppercase font-bold tracking-widest">
                TORQUE OUTPUT
                </p>
            <span className="text-blue-300 font-bold text-sm">
              {telemetry.torque_nm} NM
            </span>
          </div>
        </div>
      </div>
    </Html>
  );
}