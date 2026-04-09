"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Scramble text animation: Restricted to numbers
const ScrambleNumber = ({ finalNumber }: { finalNumber: string }) => {
  const [display, setDisplay] = useState("000.0");

  useEffect(() => {
    let frame = 0;
    const maxFrames = 30; // 1.2s
    const chars = "0123456789"; 
    
    const interval = setInterval(() => {
      frame++;
      if (frame >= maxFrames) {
        clearInterval(interval);
        setDisplay(finalNumber);
      } else {
        const scrambled = finalNumber
          .split("")
          .map((char, i) => {
            if (char === ".") return "."; 
            if (i < (frame / maxFrames) * finalNumber.length) { return char; }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");
        setDisplay(scrambled);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [finalNumber]);

  return <>{display}</>;
};

// Huge Tick-Marked Compass Ring to fill whitespace
const CompassBackground = ({ color }: { color: string }) => (
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] max-w-[1000px] max-h-[1000px] pointer-events-none opacity-[0.15] mix-blend-screen flex items-center justify-center">
    <motion.svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }}>
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.2" className={color} />
      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="0.5 4" className={color} />
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="10 2" className={color} />
    </motion.svg>
    <motion.svg viewBox="0 0 100 100" className="w-[80%] h-[80%] absolute inset-0 m-auto" animate={{ rotate: -360 }} transition={{ duration: 90, repeat: Infinity, ease: "linear" }}>
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.1" className={color} />
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="0.2 12" className={color} />
    </motion.svg>
  </div>
);

// Hexagonal pattern overlay
const HexMesh = ({ color }: { color: string }) => (
  <div className="absolute top-0 right-0 w-[60%] h-[40%] opacity-[0.05] pointer-events-none mix-blend-screen"
       style={{
         backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l10 17.32v20L20 54.64 0 37.32v-20z' fill='none' stroke='%2300e5ff' stroke-width='1'/%3E%3C/svg%3E")`,
         backgroundSize: '40px 40px',
         maskImage: 'linear-gradient(to bottom left, rgba(0,0,0,1), rgba(0,0,0,0))',
         WebkitMaskImage: 'linear-gradient(to bottom left, rgba(0,0,0,1), rgba(0,0,0,0))'
       }}
  />
);

// Smooth Lock-on Animation component
const LockOnScanner = ({ color }: { color: string }) => (
  <div className="relative w-64 h-64 flex items-center justify-center">
    <motion.div 
      className="absolute inset-0 rounded-full opacity-30"
      style={{ background: 'conic-gradient(from 0deg, transparent 70%, currentColor 100%)' }}
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    />
    <div className={`absolute inset-0 rounded-full border border-current opacity-20 ${color}`} />
    
    <motion.div initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 0.8, ease: "easeOut" }} className={`absolute w-[1px] bg-current opacity-50 ${color}`} />
    <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8, ease: "easeOut" }} className={`absolute h-[1px] bg-current opacity-50 ${color}`} />
    
    <motion.div 
      initial={{ scale: 4, opacity: 0, rotate: 45 }} 
      animate={{ scale: 1, opacity: 1, rotate: 0 }} 
      transition={{ duration: 0.6, ease: "circOut", delay: 0.2 }}
      className={`absolute w-12 h-12 border border-current opacity-80 ${color}`}
    >
      <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current ${color}`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current ${color}`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current ${color}`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current ${color}`} />
    </motion.div>
  </div>
);

export default function Home() {
  const [visitorNumber, setVisitorNumber] = useState<number | null>(null);
  const [areaStress, setAreaStress] = useState<number>(0);
  const [region, setRegion] = useState<string>("----");
  
  const [isReturning, setIsReturning] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scanStage, setScanStage] = useState<number>(0); 
  
  useEffect(() => {
    const t1 = setTimeout(() => setScanStage(1), 800); 
    const t2 = setTimeout(() => checkVisitorStatus(), 3000); 
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const checkVisitorStatus = async () => {
    try {
      const storedNumber = localStorage.getItem("nfc_visitor_number");
      
      const response = await fetch("/api/visitor", { method: "POST" });
      if (!response.ok) throw new Error("Connection failed");
      const data = await response.json();

      setRegion(data.region || "UNKNOWN");
      setAreaStress(data.areaStress || 0);

      if (storedNumber) {
        setVisitorNumber(parseInt(storedNumber, 10));
        setIsReturning(true);
      } else if (data.visitorNumber) {
        localStorage.setItem("nfc_visitor_number", data.visitorNumber.toString());
        setVisitorNumber(data.visitorNumber);
      } else {
        throw new Error("Invalid response");
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("COMMUNICATION ERROR.");
      setLoading(false);
    }
  };

  // Color logic mapping for user explanation
  const isHazard = areaStress >= 100;
  const isCaution = areaStress >= 50 && areaStress < 100;
  
  let themeColor = "border-[#00e5ff] text-[#00e5ff]";
  let shadowColor = "drop-shadow-[0_0_10px_rgba(0,229,255,0.8)]";
  let targetAction = isReturning ? "KNOWN ENTITY RESTORED" : "NEW SYNCHRONIZATION";
  
  if (error) {
    themeColor = "border-red-500 text-red-500";
    shadowColor = "drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]";
    targetAction = "SYSTEM ERROR";
  } else if (isHazard) {
    themeColor = "border-red-500 text-red-500";
    shadowColor = "drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]";
  } else if (isCaution) {
    themeColor = "border-yellow-400 text-yellow-400";
    shadowColor = "drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]";
  }

  const numericValue = visitorNumber ? `${visitorNumber.toString()}.0` : "000.0";

  return (
    <main className="fixed inset-0 w-full h-full bg-[#010204] text-white overflow-hidden selection:bg-[#00e5ff] selection:text-black font-sans">
      
      {/* Visual Depth Backgrounds */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(0,255,255,0.015)_1px,rgba(0,0,0,0)_1px)] bg-[length:100%_4px] mix-blend-overlay" />
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)' }} />
      <HexMesh color={themeColor} />
      <CompassBackground color={themeColor} />

      {/* Central Thin Reticle Grid */}
      <div className="absolute top-1/2 left-[30%] sm:left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] pointer-events-none opacity-[0.2]">
        <div className={`absolute top-1/2 -left-[50%] w-full h-[0.5px] ${themeColor}`} />
        <div className={`absolute top-1/2 -right-[50%] w-full h-[0.5px] ${themeColor}`} />
        <div className={`absolute -top-[50%] left-1/2 w-[0.5px] h-full ${themeColor}`} />
        <div className={`absolute -bottom-[50%] left-1/2 w-[0.5px] h-full ${themeColor}`} />
      </div>

      <AnimatePresence mode="wait">
        {(loading || error) && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none ${themeColor}`}
          >
            <LockOnScanner color={themeColor} />
            
            <div className={`mt-8 flex flex-col items-center`}>
              <span className={`font-mono text-sm tracking-widest uppercase italic mb-2 drop-shadow-[0_0_5px_currentColor]`}>
                {error ? "SYSTEM DOWN" : "[ TARGET SCAN IN PROGRESS ]"}
              </span>
              <div className={`w-48 h-[1px] relative overflow-hidden bg-current opacity-30`}>
                {!error && scanStage > 0 && (
                  <motion.div 
                    className="absolute inset-y-0 left-0 w-1/3 bg-current"
                    animate={{ x: ["-100%", "300%"] }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  />
                )}
              </div>
              {error && (
                <p className="font-mono text-xs text-red-500 tracking-widest mt-2">{error}</p>
              )}
            </div>
          </motion.div>
        )}

        {!loading && !error && visitorNumber !== null && (
          <motion.div
            key="hud"
            initial={{ opacity: 0, filter: "brightness(2)" }}
            animate={{ opacity: 1, filter: "brightness(1)" }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-10 pointer-events-none"
          >
            {/* RIGHT SIDE: Main Target Area */}
            <div className={`absolute top-[35%] sm:top-[40%] right-4 sm:right-[15%] -translate-y-1/2 flex flex-col items-start ${shadowColor}`}>
              <span className={`font-mono text-[10px] sm:text-[14px] font-bold leading-none italic uppercase whitespace-nowrap mb-1 ${themeColor}`}>
                VISITOR COEFFICIENT:
              </span>
              
              <div className="flex items-baseline">
                <span className="font-sans text-[4.5rem] sm:text-[7rem] md:text-[8rem] font-bold tracking-tighter text-white leading-none">
                  <ScrambleNumber finalNumber={numericValue.split(".")[0]} />
                </span>
                <span className={`font-mono text-2xl sm:text-4xl font-bold ml-1 ${themeColor}`}>
                  .{numericValue.split(".")[1]}
                </span>
              </div>
              
              {/* Context-consistent action block */}
              <div className="flex flex-col mt-2 border-l-[2px] border-current pl-3 pb-1" style={{ borderColor: themeColor.split(" ")[1].replace("text-", "") }}>
                <span className="font-mono text-[9px] sm:text-[10px] tracking-widest uppercase text-white/70">
                  STATUS:
                </span>
                <span className={`font-mono italic font-bold text-sm sm:text-lg tracking-wider whitespace-nowrap ${themeColor}`}>
                  [ {targetAction} ]
                </span>
              </div>

              {/* Informative text paragraph */}
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.5 }}
                className="font-mono text-[8.5px] sm:text-[10px] text-white/50 uppercase mt-6 max-w-[220px] leading-relaxed whitespace-normal"
              >
                Access log verified. You have been recorded as the <span className={`font-bold ${themeColor}`}>{visitorNumber}th</span> entity to synchronize with this terminal.
              </motion.p>
            </div>

            {/* LEFT BOTTOM: Area Level Radar (Shifted slightly down to increase gap) */}
            <div className="absolute bottom-[10%] sm:bottom-24 left-4 sm:left-12 flex flex-col items-start">
              
              {/* Added detail elements above the radar */}
              <div className="flex items-center space-x-2 mb-4 opacity-70">
                <div className={`w-8 h-[1px] bg-current ${themeColor}`} />
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white">NETWORK // SECURE_LINK</span>
              </div>

              <div className="relative w-28 h-28 sm:w-40 sm:h-40 mb-4 ml-4">
                <div className={`absolute inset-0 rounded-full border-[0.5px] border-current opacity-30 ${themeColor}`} />
                
                {/* Thick radar sweep element inside */}
                <motion.div 
                  className={`absolute inset-2 rounded-full border-t-[8px] border-l-[2px] border-current opacity-60 ${themeColor}`}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
                <motion.div 
                  className={`absolute inset-5 rounded-full border-b-[2px] border-current opacity-80 ${themeColor}`}
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }}
                />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-current opacity-80 ${themeColor}`} />
              </div>
              
              <div className={`flex flex-col border-l border-current pl-3 ml-2 ${themeColor}`}>
                <span className={`font-mono text-[10px] sm:text-xs uppercase tracking-widest font-bold whitespace-nowrap mb-1`}>
                  AREA SYNCHRO LEVEL
                </span>
                <div className="flex items-end space-x-3 mb-1">
                  <span className="font-mono italic font-bold text-3xl sm:text-4xl text-white leading-none">
                    {areaStress.toString().padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[8px] text-white/50 tracking-widest mb-1">
                    {region}
                  </span>
                </div>
                <span className="font-mono text-[7px] sm:text-[8px] text-white/40 uppercase mt-2 max-w-[190px] leading-relaxed">
                  Regional synchro-log updated. YOU and <span className={`font-bold text-white`}>{areaStress > 1 ? areaStress - 1 : 0}</span> OTHER ENTITIES have synchronized within the [{region}] sector.
                </span>
              </div>
            </div>

            {/* Small frame marks */}
            <div className={`absolute top-4 left-4 w-4 h-4 border-t border-l ${themeColor} opacity-[0.3]`} />
            <div className={`absolute top-4 right-4 w-4 h-4 border-t border-r ${themeColor} opacity-[0.3]`} />
            <div className={`absolute bottom-4 left-4 w-4 h-4 border-b border-l ${themeColor} opacity-[0.3]`} />
            <div className={`absolute bottom-4 right-4 w-4 h-4 border-b border-r ${themeColor} opacity-[0.3]`} />
            
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
