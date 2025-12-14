import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface College {
  name: string;
  x: number;
  y: number;
}

const colleges: College[] = [
  { name: "RVCE", x: 30, y: 40 },
  { name: "PESU", x: 60, y: 30 },
  { name: "BMS", x: 45, y: 60 },
  { name: "Christ", x: 70, y: 50 },
  { name: "MSRIT", x: 25, y: 70 },
  { name: "BMSCE", x: 80, y: 35 },
];

export const TrustMap = () => {
  const [connections, setConnections] = useState<[College, College][]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const from = colleges[Math.floor(Math.random() * colleges.length)];
      const to = colleges[Math.floor(Math.random() * colleges.length)];
      if (from !== to) {
        setConnections(prev => [...prev.slice(-3), [from, to]]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-3 md:mb-4">
            Live Trust Network
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch students connect across Bengaluru campuses in real-time.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-[16/10] md:aspect-video glass-strong rounded-2xl md:rounded-3xl overflow-hidden">
            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full">
              {connections.map(([from, to], index) => (
                <motion.line
                  key={index}
                  x1={`${from.x}%`}
                  y1={`${from.y}%`}
                  x2={`${to.x}%`}
                  y2={`${to.y}%`}
                  stroke="url(#gradient)"
                  strokeWidth="2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: [0, 1, 0] }}
                  transition={{ duration: 2 }}
                />
              ))}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>

            {/* College nodes */}
            {colleges.map((college, index) => (
              <motion.div
                key={index}
                className="absolute"
                style={{ left: `${college.x}%`, top: `${college.y}%`, transform: 'translate(-50%, -50%)' }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <motion.div
                  className="relative"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-primary/30 rounded-full blur-md animate-pulse-glow" />
                  
                  {/* Node */}
                  <div className="relative w-3 h-3 md:w-4 md:h-4 bg-gradient-trust rounded-full shadow-glow" />
                  
                  {/* Label - smaller on mobile */}
                  <div className="absolute top-5 md:top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-[10px] md:text-xs font-medium bg-background/80 backdrop-blur px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                      {college.name}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-6 md:mt-8 text-center"
          >
            <p className="text-xs md:text-sm text-muted-foreground italic">
              "Trust spreads across campuses. Join the movement."
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};