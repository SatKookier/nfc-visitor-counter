"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Scramble text animation: Restricted to numbers, delayed start for mechanical impact
const ScrambleNumber = ({ finalNumber, delayMs = 0 }: { finalNumber: string, delayMs?: number }) => {
  const [display, setDisplay] = useState(finalNumber.replace(/[0-9]/g, "0"));

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    timeout = setTimeout(() => {
      let frame = 0;
      const maxFrames = 30; // Intense scramble duration
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
              // Reveal characters gradually from left to right as frames progress
              if (i < (frame / maxFrames) * finalNumber.length) { return char; }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("");
          setDisplay(scrambled);
        }
      }, 30); // Faster tick rate

      return () => clearInterval(interval);
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [finalNumber, delayMs]);

  return <>{display}</>;
};

// Huge Tick-Marked Compass Ring to fill whitespace
const CompassBackground = ({ color, isLocked }: { color: string, isLocked?: boolean }) => (
  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] max-w-[800px] max-h-[800px] pointer-events-none mix-blend-screen flex items-center justify-center transition-opacity duration-1000 ${isLocked ? "opacity-10" : "opacity-[0.15]"}`}>
    <motion.svg viewBox="0 0 100 100" className="absolute w-[90%] h-[90%]" animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.1" className={color} />
      {/* Outer Gear */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="1 3" className={color} />
    </motion.svg>
    <motion.svg viewBox="0 0 100 100" className="absolute w-[75%] h-[75%]" animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }}>
      {/* Inner Gear */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="15 2 2 2" className={color} />
      <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="0.5 6" className={color} />
    </motion.svg>
    <motion.svg viewBox="0 0 100 100" className="absolute w-[60%] h-[60%]" animate={{ rotate: 360 }} transition={{ duration: 80, repeat: Infinity, ease: "linear" }}>
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.2" className={color} />
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="30 4" className={color} />
    </motion.svg>
  </div>
);

// Hexagonal pattern overlay
const HexMesh = ({ color }: { color: string }) => (
  <div className="absolute top-0 right-0 w-[60%] h-[40%] opacity-[0.04] pointer-events-none mix-blend-screen"
       style={{
         backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l10 17.32v20L20 54.64 0 37.32v-20z' fill='none' stroke='%2300e5ff' stroke-width='1'/%3E%3C/svg%3E")`,
         backgroundSize: '40px 40px',
         maskImage: 'linear-gradient(to bottom left, rgba(0,0,0,1), rgba(0,0,0,0))',
         WebkitMaskImage: 'linear-gradient(to bottom left, rgba(0,0,0,1), rgba(0,0,0,0))'
       }}
  />
);

// Persistent Reticle - changes mode based on scan completion
const LockOnScanner = ({ color, isLocked }: { color: string, isLocked: boolean }) => (
  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center z-0 pointer-events-none ${color}`}>
    
    {/* CSS-based transition prevents framer-motion from resetting animations on exit */}
    <div className={`absolute inset-0 transition-opacity duration-300 ${isLocked ? 'opacity-0' : 'opacity-100'}`}>
      <motion.div 
        className="absolute inset-0 rounded-full mix-blend-screen"
        style={{ background: 'conic-gradient(from 0deg, transparent 70%, currentColor 100%)', opacity: 0.4 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="absolute inset-4 rounded-full border border-current opacity-30" 
        style={{ borderStyle: "dashed" }} 
        animate={{ rotate: -360 }} 
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }} 
      />
    </div>

    <div className={`absolute inset-0 rounded-full border border-current transition-all duration-1000 ${isLocked ? "opacity-[0.15] border-[1px] scale-90" : "opacity-20 scale-100"}`} />
    
    <motion.div initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ duration: 0.8, ease: "easeOut" }} className={`absolute w-[1px] bg-current transition-all duration-1000 ${isLocked ? "opacity-20" : "opacity-60"}`} />
    <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8, ease: "easeOut" }} className={`absolute h-[1px] bg-current transition-all duration-1000 ${isLocked ? "opacity-20" : "opacity-60"}`} />
    
    {/* Target Square that smoothly snaps on lock */}
    <motion.div 
      initial={{ scale: 4, opacity: 0, rotate: 45, borderWidth: "1px" }} 
      animate={isLocked ? { scale: 0.5, opacity: 1, rotate: 0, borderWidth: "3px" } : { scale: 1.0, opacity: 0.8, rotate: 0, borderWidth: "1px" }} 
      transition={isLocked ? { duration: 0.4, ease: "easeOut" } : { duration: 0.6, ease: "circOut", delay: 0.2 }}
      className={`absolute w-12 h-12 border-current`}
    >
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current" />
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
    // Artificial dramatic delay
    const t1 = setTimeout(() => setScanStage(1), 1000); 
    const t2 = setTimeout(() => checkVisitorStatus(), 3500); 
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const checkVisitorStatus = async () => {
    try {
      const storedNumber = localStorage.getItem("nfc_visitor_number");
      
      const response = await fetch("/api/visitor", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isReturning: !!storedNumber })
      });
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
  const isLocked = !loading && visitorNumber !== null && !error;

  return (
    <main className="fixed inset-0 w-full h-full bg-[#010204] text-white overflow-hidden selection:bg-[#00e5ff] selection:text-black font-sans">
      
      {/* Background Graphic Fields */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(0,255,255,0.015)_1px,rgba(0,0,0,0)_1px)] bg-[length:100%_4px] mix-blend-overlay" />
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)' }} />
      <HexMesh color={themeColor} />
      <CompassBackground color={themeColor} isLocked={isLocked || !!error} />

      {/* Persistent Background Alignment Grid */}
      <div className={`absolute top-1/2 left-[30%] sm:left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] pointer-events-none transition-opacity duration-1000 ${isLocked || !!error ? "opacity-10" : "opacity-[0.15]"}`}>
        <div className={`absolute top-1/2 -left-[50%] w-full h-[0.5px] ${themeColor}`} />
        <div className={`absolute top-1/2 -right-[50%] w-full h-[0.5px] ${themeColor}`} />
        <div className={`absolute -top-[50%] left-1/2 w-[0.5px] h-full ${themeColor}`} />
        <div className={`absolute -bottom-[50%] left-1/2 w-[0.5px] h-full ${themeColor}`} />
      </div>

      {/* The Central Reticle is permanently anchored, driving the visual narrative */}
      <LockOnScanner color={themeColor} isLocked={isLocked || !!error} />

      {/* Loading Scan Overlay */}
      <AnimatePresence>
        {(loading || error) && (
          <motion.div
            key="scan-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.1 }} // Extreme fast disappear, no fading
            className={`absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none ${themeColor}`}
          >
            <div className={`mt-32 flex flex-col items-center`}>
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
      </AnimatePresence>

      {/* Result HUD Panels: Sliding in aggressively from the edges */}
      <AnimatePresence>
        {isLocked && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            
            {/* Visual Screen Flash to simulate lock-on burst */}
            <motion.div 
              initial={{ opacity: 0.8 }} 
              animate={{ opacity: 0 }} 
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute inset-0 bg-cyan-200 mix-blend-overlay z-50 pointer-events-none"
            />

            {/* RIGHT SIDE: Main Target Area */}
            <motion.div 
              initial={{ x: "20vw", opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
              className={`absolute top-[32%] sm:top-[38%] right-4 sm:right-[15%] -translate-y-1/2 flex flex-col items-start ${shadowColor}`}
            >
              <span className={`font-mono text-[10px] sm:text-[14px] font-bold leading-none italic uppercase whitespace-nowrap mb-1 ${themeColor}`}>
                VISITOR COEFFICIENT:
              </span>
              
              <div className="flex items-baseline overflow-hidden py-1">
                <span className="font-sans text-[4.5rem] sm:text-[7rem] md:text-[8rem] font-bold tracking-tighter text-white leading-none">
                  {/* Wait 200ms AFTER panel arrives before scrambling for solid impact */}
                  <ScrambleNumber finalNumber={numericValue.split(".")[0]} delayMs={300} />
                </span>
                <span className={`font-mono text-2xl sm:text-4xl font-bold ml-1 ${themeColor}`}>
                  .{numericValue.split(".")[1]}
                </span>
              </div>
              
              <motion.div 
                initial={{ x: 20, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.4 }}
                className="flex flex-col mt-2 border-l-[2px] border-current pl-3 pb-1" style={{ borderColor: themeColor.split(" ")[1].replace("text-", "") }}
              >
                <span className="font-mono text-[9px] sm:text-[10px] tracking-widest uppercase text-white/70">
                  STATUS:
                </span>
                <span className={`font-mono italic font-bold text-sm sm:text-lg tracking-wider whitespace-nowrap ${themeColor}`}>
                  [ {targetAction} ]
                </span>
              </motion.div>

              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.5, delay: 0.8 }}
                className="font-mono text-[8.5px] sm:text-[10px] text-white/50 uppercase mt-6 max-w-[220px] leading-relaxed whitespace-normal"
              >
                Access log verified. You have been recorded as the <span className={`font-bold ${themeColor}`}>
                  <ScrambleNumber finalNumber={visitorNumber.toString()} delayMs={600} />th
                </span> entity to synchronize with this terminal.
              </motion.p>
            </motion.div>

            {/* LEFT BOTTOM: Area Level Radar */}
            <motion.div 
              initial={{ y: "10vh", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.3 }}
              className="absolute bottom-[10%] sm:bottom-24 left-4 sm:left-12 flex flex-col items-start"
            >
              
              <div className="flex items-center space-x-2 mb-4 opacity-70">
                <div className={`w-8 h-[1px] bg-current ${themeColor}`} />
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white">NETWORK // SECURE_LINK</span>
              </div>

              <div className="relative w-28 h-28 sm:w-40 sm:h-40 mb-4 ml-4">
                <div className={`absolute inset-0 rounded-full border-[0.5px] border-current opacity-30 ${themeColor}`} />
                
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
                    <ScrambleNumber finalNumber={areaStress.toString().padStart(2, "0")} delayMs={500} />
                  </span>
                  <span className="font-mono text-[8px] text-white/50 tracking-widest mb-1">
                    {region}
                  </span>
                </div>
                <span className="font-mono text-[7px] sm:text-[8px] text-white/40 uppercase mt-2 max-w-[190px] leading-relaxed">
                  Regional synchro-log updated. YOU and <span className={`font-bold text-white`}>
                    <ScrambleNumber finalNumber={areaStress > 1 ? (areaStress - 1).toString() : "0"} delayMs={600} />
                  </span> OTHER ENTITIES have synchronized within the [{region}] sector.
                </span>
              </div>
            </motion.div>

            {/* Frame marks fade in last */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} transition={{ delay: 0.8 }}>
              <div className={`absolute top-4 left-4 w-4 h-4 border-t border-l ${themeColor}`} />
              <div className={`absolute top-4 right-4 w-4 h-4 border-t border-r ${themeColor}`} />
              <div className={`absolute bottom-4 left-4 w-4 h-4 border-b border-l ${themeColor}`} />
              <div className={`absolute bottom-4 right-4 w-4 h-4 border-b border-r ${themeColor}`} />
            </motion.div>
            
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
