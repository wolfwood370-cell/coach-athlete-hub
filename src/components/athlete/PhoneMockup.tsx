import { ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
}

export function PhoneMockup({ children }: PhoneMockupProps) {
  return (
    <div className="hidden lg:flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
      {/* Google Pixel 10 Pro mockup frame */}
      <div className="relative">
        {/* Phone outer frame - Pixel style with softer corners */}
        <div className="relative w-[375px] h-[812px] bg-[#e8e8e8] dark:bg-[#2d2d2d] rounded-[40px] p-[8px] shadow-2xl shadow-black/40">
          {/* Aluminum frame accent */}
          <div className="absolute inset-0 rounded-[40px] border border-[#d0d0d0] dark:border-[#404040] pointer-events-none" />
          
          {/* Side buttons - left (volume) */}
          <div className="absolute -left-[2px] top-[140px] w-[2px] h-[45px] bg-[#c0c0c0] dark:bg-[#3a3a3a] rounded-l-sm" />
          <div className="absolute -left-[2px] top-[200px] w-[2px] h-[45px] bg-[#c0c0c0] dark:bg-[#3a3a3a] rounded-l-sm" />
          
          {/* Side button - right (power) */}
          <div className="absolute -right-[2px] top-[160px] w-[2px] h-[55px] bg-[#c0c0c0] dark:bg-[#3a3a3a] rounded-r-sm" />
          
          {/* Screen bezel - minimal Pixel bezels */}
          <div className="relative w-full h-full bg-black rounded-[32px] overflow-hidden">
            {/* Pixel punch-hole camera (centered) */}
            <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-[12px] h-[12px] bg-[#0a0a0a] rounded-full z-50 shadow-inner">
              <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]" />
              <div className="absolute top-[3px] left-[3px] w-[2px] h-[2px] rounded-full bg-[#2a2a2a]" />
            </div>
            
            {/* Screen content */}
            <div className="w-full h-full overflow-hidden">
              {children}
            </div>
          </div>
        </div>
        
        {/* Subtle glass reflection effect */}
        <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-white/3 to-transparent pointer-events-none" />
        
        {/* Pixel signature camera bar hint at top back (decorative) */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[180px] h-[4px] bg-gradient-to-r from-transparent via-[#d0d0d0] dark:via-[#404040] to-transparent rounded-full opacity-50" />
      </div>
    </div>
  );
}

export function ResponsivePhoneWrapper({ children }: PhoneMockupProps) {
  return (
    <>
      {/* Mobile: Show app directly */}
      <div className="lg:hidden">
        {children}
      </div>
      
      {/* Desktop: Show inside phone mockup */}
      <PhoneMockup>
        {children}
      </PhoneMockup>
    </>
  );
}
