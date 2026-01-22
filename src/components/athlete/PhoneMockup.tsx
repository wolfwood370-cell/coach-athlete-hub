import { ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
}

export function PhoneMockup({ children }: PhoneMockupProps) {
  return (
    <div className="hidden lg:flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
      {/* Google Pixel 10 Pro mockup frame */}
      <div className="relative">
        {/* Phone outer frame - Pixel 10 Pro dimensions with softer corners */}
        <div className="relative w-[360px] h-[800px] bg-[#1f1f1f] rounded-[40px] p-[10px] shadow-2xl shadow-black/50">
          {/* Side button - right (power) - Pixel style */}
          <div className="absolute -right-[3px] top-[160px] w-[3px] h-[50px] bg-[#3a3a3a] rounded-r-sm" />
          
          {/* Volume buttons - right side on Pixel */}
          <div className="absolute -right-[3px] top-[230px] w-[3px] h-[70px] bg-[#3a3a3a] rounded-r-sm" />
          
          {/* Screen bezel - Pixel has more uniform bezels */}
          <div className="relative w-full h-full bg-black rounded-[32px] overflow-hidden">
            {/* Punch-hole camera - centered at top for Pixel */}
            <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-[12px] h-[12px] bg-[#0a0a0a] rounded-full z-50 ring-1 ring-[#2a2a2a]" />
            
            {/* Screen content */}
            <div className="w-full h-full overflow-hidden">
              {children}
            </div>
          </div>
        </div>
        
        {/* Subtle glass reflection effect */}
        <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-white/3 to-transparent pointer-events-none" />
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
