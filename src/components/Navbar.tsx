import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Menu, X, MessageCircle, LayoutDashboard, User, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Navbar = () => {
  const { user, profile, isProfileComplete, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleProfileClick = () => {
    if (!isProfileComplete) {
      navigate('/profile-setup');
    } else {
      navigate(`/profile/${user?.id}`);
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-strong border-b border-border/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <img src="/logo.png" alt="S.V.I.P Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-lg mix-blend-multiply" />
              </motion.div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {user ? (
                <>
                  {navItems.map(({ path, icon: Icon, label }) => (
                    <Link key={path} to={path} className="relative">
                      <Button
                        variant={isActive(path) ? "default" : "ghost"}
                        className={`gap-2 rounded-xl transition-all duration-300 ${isActive(path)
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-secondary/50'
                          }`}
                      >
                        <Icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                        {label}
                      </Button>
                      {isActive(path) && (
                        <motion.div
                          layoutId="activeNavIndicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>
                  ))}

                  {/* Trust Score Badge */}
                  {profile && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="mx-3 px-4 py-2 rounded-xl bg-gradient-trust/10 border border-trust/20 flex items-center gap-2 cursor-default"
                    >
                      <Sparkles className="w-4 h-4 text-trust" />
                      <span className="text-sm font-bold text-trust">{profile.trust_score || 0}</span>
                    </motion.div>
                  )}

                  <Button
                    variant={isActive(`/profile/${user.id}`) ? "trust" : "ghost"}
                    onClick={handleProfileClick}
                    className="gap-2 rounded-xl ml-1"
                  >
                    <div className="relative">
                      <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      {profile?.is_verified && (
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-trust flex items-center justify-center">
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="max-w-[100px] truncate font-medium">{profile?.full_name || 'Profile'}</span>
                  </Button>

                  <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive ml-1 rounded-xl">
                    <LogOut className="w-5 h-5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="rounded-xl">How It Works</Button>
                  <Link to="/auth">
                    <Button variant="hero" size="lg" className="ml-2">
                      Join Now
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden glass-strong border-b border-border/30"
          >
            <div className="container mx-auto px-4 py-5 space-y-2">
              {user ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
                        {profile?.full_name?.charAt(0) || '?'}
                      </div>
                      {profile?.is_verified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-trust flex items-center justify-center border-2 border-card">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{profile?.full_name || 'User'}</p>
                      <div className="flex items-center gap-1.5 text-sm text-trust">
                        <Sparkles className="w-3.5 h-3.5" />
                        {profile?.trust_score || 0} Trust Score
                      </div>
                    </div>
                  </div>

                  {navItems.map(({ path, icon: Icon, label }) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant={isActive(path) ? "default" : "ghost"}
                        className={`w-full justify-start gap-3 h-13 rounded-xl text-base ${isActive(path) ? '' : ''}`}
                      >
                        <Icon className="w-5 h-5" />
                        {label}
                      </Button>
                    </Link>
                  ))}

                  <Button
                    variant="ghost"
                    onClick={handleProfileClick}
                    className="w-full justify-start gap-3 h-13 rounded-xl text-base"
                  >
                    <User className="w-5 h-5" />
                    My Profile
                  </Button>

                  <div className="pt-3 mt-3 border-t border-border/30">
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="w-full justify-start gap-3 h-13 rounded-xl text-base text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="w-full justify-start h-13 rounded-xl text-base">How It Works</Button>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="hero" className="w-full h-13 rounded-xl text-base">Join Now</Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};