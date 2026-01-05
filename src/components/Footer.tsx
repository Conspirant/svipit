import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const Footer = () => {
  return (
    <footer className="border-t border-border/30 py-10 md:py-12 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-5 md:gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="S.V.I.P Logo" className="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-lg" />
            <span className="text-xl md:text-2xl font-display font-bold gradient-text">SVIP it</span>
          </Link>

          <p className="text-center text-sm md:text-base text-muted-foreground max-w-md px-4">
            Student Verified Interconnect Platform — Building trust-based communities,
            one campus at a time.
          </p>

          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
            <motion.a
              href="#"
              className="hover:text-primary transition-colors py-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              About
            </motion.a>
            <motion.a
              href="#"
              className="hover:text-primary transition-colors py-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              How It Works
            </motion.a>
            <motion.a
              href="#"
              className="hover:text-primary transition-colors py-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Privacy
            </motion.a>
            <motion.a
              href="#"
              className="hover:text-primary transition-colors py-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Terms
            </motion.a>
            <motion.a
              href="#"
              className="hover:text-primary transition-colors py-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Contact
            </motion.a>
          </div>

          <div className="border-t border-border/30 pt-5 md:pt-6 w-full text-center text-xs md:text-sm text-muted-foreground">
            <p>© 2024 S.v.i.p. Built with ❤️ for students, by students.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};