import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronDown, Shield, Star, Users } from "lucide-react";
import heroImage from "@/assets/hero-students.jpg";
import { useAuth } from "@/hooks/useAuth";
import { AssociationBadge } from "@/components/AssociationBadge";

export const Hero = () => {
  const { user } = useAuth();

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* College Campus Background - More visible and elegant */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.img
          src="/svit-campus.jpg"
          alt="SVIT Campus"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.75) saturate(0.9)' }}
          onLoad={() => {
            console.log("✅ Campus image loaded successfully from: /svit-campus.jpg");
          }}
          onError={(e) => {
            // Try alternative paths
            const img = e.currentTarget;
            console.log(`❌ Failed to load campus image from: ${img.src}`);
            if (img.src.includes('.jpg')) {
              console.log("Trying: /svit-campus.JPG");
              img.src = "/svit-campus.JPG";
            } else if (img.src.includes('.JPG')) {
              console.log("Trying: /svit-campus (no extension)");
              img.src = "/svit-campus";
            } else {
              console.warn("⚠️ All campus image paths failed. Make sure file is named 'svit-campus.jpg' in public/ folder");
              img.style.display = 'none';
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-background/40 to-background/50" />
      </div>

      {/* Mesh gradient background */}
      <div className="absolute inset-0 gradient-mesh opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      {/* Subtle noise texture */}
      <div className="absolute inset-0 noise opacity-30" />

      {/* Animated background elements - simplified on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-[10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/10 rounded-full blur-[80px] md:blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-[5%] w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-accent/10 rounded-full blur-[60px] md:blur-[100px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10 pt-24 md:pt-28 pb-12">
        {/* Association Badge - Top Section */}
        <AssociationBadge />

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 mb-5 md:mb-6 px-4 py-2 rounded-full glass-strong text-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-trust animate-pulse" />
              <span className="font-medium">
                Bengaluru's First Student Trust Network
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-5 md:mb-8 leading-[1.1] tracking-tight">
              Built on{" "}
              <span className="gradient-text">trust.</span>
              <br />
              Powered by{" "}
              <span className="gradient-text">students.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Connect locally to exchange skills, favors, or time —
              verified through your college ID.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link to={user ? "/dashboard" : "/auth"} className="w-full sm:w-auto">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button variant="hero" size="xl" className="w-full sm:w-auto">
                    {user ? "Go to Dashboard" : "Join the Movement"}
                  </Button>
                </motion.div>
              </Link>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="glass" size="xl" onClick={scrollToFeatures} className="gap-2 w-full sm:w-auto">
                  See How It Works
                  <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-1" />
                </Button>
              </motion.div>
            </div>

            {/* Social proof - hidden on very small screens */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-10 md:mt-12 flex flex-wrap items-center gap-4 md:gap-6 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2.5">
                {['🎓', '💡', '🚀', '✨'].map((emoji, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-primary flex items-center justify-center border-2 border-background text-base md:text-lg"
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
              <div className="text-sm">
                <p className="font-semibold">500+ Students</p>
                <p className="text-muted-foreground">Already connected</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Image - Hidden on mobile, shown as smaller on tablet */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden md:block"
          >
            <div className="relative">
              {/* Main image */}
              <div className="rounded-3xl overflow-hidden shadow-premium relative">
                <img
                  src={heroImage}
                  alt="Students collaborating and connecting"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              </div>

              {/* Floating cards */}
              <motion.div
                className="absolute -bottom-6 -left-6 glass-strong rounded-2xl p-4 lg:p-5 shadow-elegant"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-3 lg:gap-4">
                  <img src="/logo.png" alt="S.V.I.P Logo" className="w-14 h-14 lg:w-16 lg:h-16 object-contain drop-shadow-lg" />
                  <div>
                    <p className="font-bold text-base lg:text-lg">98%</p>
                    <p className="text-xs text-muted-foreground">Trust Score</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -top-4 -right-4 glass-strong rounded-2xl p-3 lg:p-4 shadow-elegant"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-warm flex items-center justify-center">
                    <Star className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Verified</p>
                    <p className="text-xs text-muted-foreground">College ID</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute top-1/2 -right-10 glass-strong rounded-xl p-2.5 lg:p-3 shadow-md hidden lg:block"
                animate={{ x: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium">12 colleges</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator - Hidden on mobile */}
        <motion.div
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 hidden md:block"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollToFeatures}
            className="rounded-full opacity-60 hover:opacity-100"
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};