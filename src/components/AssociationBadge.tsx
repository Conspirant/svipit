import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { useState } from "react";

export const AssociationBadge = () => {
  const [svitImageError, setSvitImageError] = useState(false);
  const [naacImageError, setNaacImageError] = useState(false);
  const [svitSrc, setSvitSrc] = useState("/svit-logo.png");
  const [naacSrc, setNaacSrc] = useState("/naac-badge.png");
  
  // Try loading with extension first, then without
  const handleSvitError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (img.src.includes('.png')) {
      // Try without extension
      setSvitSrc("/svit-logo");
      img.src = "/svit-logo";
    } else {
      // Both failed, show fallback
      setSvitImageError(true);
    }
  };
  
  const handleNaacError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (img.src.includes('.png')) {
      // Try without extension
      setNaacSrc("/naac-badge");
      img.src = "/naac-badge";
    } else {
      // Both failed, show fallback
      setNaacImageError(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center mb-6 md:mb-10"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="relative w-full max-w-5xl"
      >
        {/* More visible background with college campus */}
        <div className="absolute inset-0 rounded-2xl md:rounded-3xl overflow-hidden">
          <motion.img
            src="/svit-campus.jpg"
            alt="SVIT Campus"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.45, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
            className="w-full h-full object-cover scale-110 blur-2xl"
            style={{ filter: 'brightness(0.7) saturate(0.85)' }}
            onError={(e) => {
              // Try alternative paths
              const img = e.currentTarget;
              if (img.src.includes('.jpg')) {
                img.src = "/svit-campus.JPG";
              } else if (img.src.includes('.JPG')) {
                img.src = "/svit-campus";
              } else {
                img.style.display = 'none';
              }
            }}
          />
        </div>
        
        {/* Main content */}
        <div className="relative glass-strong rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-elegant hover:shadow-premium transition-all duration-300 backdrop-blur-xl border border-primary/10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
            {/* Association Text - More subtle and integrated */}
            <div className="text-center sm:text-left flex-1">
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[10px] md:text-xs text-muted-foreground/80 mb-1 flex items-center justify-center sm:justify-start gap-1.5 uppercase tracking-wider"
              >
                <GraduationCap className="w-3 h-3 md:w-3.5 md:h-3.5 text-primary/70" />
                <span>In Partnership With</span>
              </motion.p>
              <motion.h3 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="text-[20px] font-display font-semibold text-foreground/90"
              >
                Sai Vidya Institute of Technology
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-[10px] md:text-xs text-muted-foreground/70 mt-0.5 font-medium"
              >
                Bangalore • NAAC A-Grade Accredited
              </motion.p>
            </div>

            {/* Subtle Divider */}
            <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-transparent via-border/30 to-transparent" />

            {/* SVIT Logo - More integrated */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.03 }}
              className="flex-shrink-0"
            >
              <div className="w-[150px] h-[150px] rounded-xl bg-white/80 backdrop-blur-sm p-2 shadow-md flex items-center justify-center border border-primary/10 relative overflow-hidden group hover:border-primary/30 hover:bg-white/90 transition-all duration-300">
                {!svitImageError ? (
                  <img
                    src={svitSrc}
                    alt="Sai Vidya Institute of Technology Logo"
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={handleSvitError}
                  />
                ) : (
                  <div className="text-center">
                    <GraduationCap className="w-8 h-8 md:w-10 md:h-10 mx-auto text-primary/80 mb-0.5" />
                    <p className="text-[9px] md:text-[10px] font-semibold text-primary/80">SVIT</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Subtle Divider */}
            <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-transparent via-border/30 to-transparent" />

            {/* NAAC Badge - More integrated */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.03 }}
              className="flex-shrink-0"
            >
              <div className="w-[150px] h-[150px] rounded-xl bg-white/80 backdrop-blur-sm p-2 shadow-md flex items-center justify-center border border-amber-500/10 relative overflow-hidden group hover:border-amber-500/30 hover:bg-white/90 transition-all duration-300">
                {!naacImageError ? (
                  <img
                    src={naacSrc}
                    alt="NAAC A-Grade Accreditation"
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    onError={handleNaacError}
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-1 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-lg md:text-xl">A</span>
                    </div>
                    <p className="text-[8px] md:text-[9px] font-semibold text-amber-600/80">NAAC</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

