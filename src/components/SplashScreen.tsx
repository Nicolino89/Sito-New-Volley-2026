import React from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  logoUrl?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ logoUrl }) => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 select-none overflow-hidden"
      id="nva-splash-screen"
    >
      {/* Background Radial Ambient Glow */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(245, 216, 0, 0.18) 0%, rgba(245, 216, 0, 0.04) 45%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-sm">
        
        {/* Animated Glowing Logo */}
        <motion.div 
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: [0.95, 1.05, 1], opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative flex items-center justify-center"
        >
          {logoUrl && logoUrl.trim() !== '' ? (
            <img 
              src={logoUrl} 
              alt="New Volley Academy" 
              className="w-28 h-28 md:w-32 md:h-32 object-contain filter drop-shadow-[0_0_25px_rgba(245,216,0,0.6)]"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-zinc-900 border-2 border-brand-yellow flex items-center justify-center text-brand-yellow font-bebas text-4xl shadow-[0_0_30px_rgba(245,216,0,0.4)]">
              NVA
            </div>
          )}
        </motion.div>

        {/* Brand Title & Subtitle */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="space-y-1.5"
        >
          <h1 className="text-2xl md:text-3xl font-barlow font-black text-white uppercase italic tracking-widest leading-none drop-shadow-md">
            NEW VOLLEY ACADEMY
          </h1>
          <p className="text-[11px] md:text-xs font-inter font-semibold tracking-[0.25em] text-brand-yellow uppercase">
            LE PANTERE • FORLÌ
          </p>
        </motion.div>

        {/* Minimalist Progress Bar */}
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "130px", opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="h-1 bg-zinc-850 rounded-full overflow-hidden mt-3"
        >
          <motion.div 
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
            className="w-full h-full bg-gradient-to-r from-transparent via-brand-yellow to-transparent"
          />
        </motion.div>

      </div>
    </motion.div>
  );
};

export default SplashScreen;
