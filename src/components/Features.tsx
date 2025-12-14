import { motion } from "framer-motion";
import { Shield, MapPin, Award, Users, Sparkles, Heart } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Trust",
    description: "Every member verified through their college ID.",
    color: "trust",
  },
  {
    icon: MapPin,
    title: "Local First",
    description: "Connect with students from nearby colleges.",
    color: "primary",
  },
  {
    icon: Award,
    title: "Earn Recognition",
    description: "Build trust score, earn badges, get recognized.",
    color: "accent",
  },
  {
    icon: Users,
    title: "Skill Exchange",
    description: "Offer what you're good at, get what you need.",
    color: "primary",
  },
  {
    icon: Sparkles,
    title: "Community First",
    description: "Not a marketplace — mutual support system.",
    color: "trust",
  },
  {
    icon: Heart,
    title: "Give Thanks",
    description: "Endorse skills, build lasting connections.",
    color: "accent",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-20 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-50" />

      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-20"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 md:mb-6"
          >
            Why Choose Us
          </motion.span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 md:mb-6">
            Why <span className="gradient-text">S.v.i.p</span>?
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
            A new way for students to help each other, build trust, and create lasting connections.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group glass-strong rounded-2xl md:rounded-3xl p-5 md:p-8 hover:shadow-elegant transition-all duration-300 active:scale-[0.98] cursor-pointer"
            >
              <motion.div 
                className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-${feature.color === 'trust' ? 'trust' : feature.color === 'accent' ? 'accent' : 'primary'} flex items-center justify-center mb-4 md:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                whileHover={{ rotate: [0, -5, 5, -5, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </motion.div>
              <h3 className="text-lg md:text-xl font-display font-bold mb-2 md:mb-3">{feature.title}</h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};