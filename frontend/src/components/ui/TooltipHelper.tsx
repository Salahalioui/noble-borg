"use client";

import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, Info, X, Lightbulb } from "lucide-react";

interface TooltipHelperProps {
  title: string;
  explanation: string;
  howToUse: string;
}

export default function TooltipHelper({
  title,
  explanation,
  howToUse
}: TooltipHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverWidth = 280;
      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      
      // Keep within viewport boundaries
      if (left < 10) left = 10;
      if (left + popoverWidth > window.innerWidth - 10) {
        left = window.innerWidth - popoverWidth - 10;
      }

      // Check if top placement fits, otherwise place bottom
      let top = rect.top - 12;
      if (top < 180) {
        top = rect.bottom + 8; // place below
      }

      setCoords({ top, left });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClose = () => setIsOpen(false);
    if (isOpen) {
      window.addEventListener("scroll", handleClose, true);
      window.addEventListener("resize", handleClose);
    }
    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [isOpen]);

  return (
    <span className="inline-flex items-center ml-1 select-none">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        onMouseEnter={() => {
          if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const popoverWidth = 280;
            let left = rect.left + rect.width / 2 - popoverWidth / 2;
            if (left < 10) left = 10;
            if (left + popoverWidth > window.innerWidth - 10) {
              left = window.innerWidth - popoverWidth - 10;
            }
            let top = rect.top - 12;
            if (top < 180) top = rect.bottom + 8;
            setCoords({ top, left });
          }
          setIsOpen(true);
        }}
        onMouseLeave={() => setIsOpen(false)}
        className="p-0.5 rounded-full text-slate-500 hover:text-accent-cyan hover:bg-slate-800/60 transition focus:outline-none"
        title={`Learn about ${title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop on mobile for easy dismissal */}
          <div
            className="fixed inset-0 z-[9990] bg-black/40 sm:hidden"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />

          {/* Fixed Floating Tooltip Card (Never Clipped) */}
          <div
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: coords.top < 200 ? "none" : "translateY(-100%)",
            }}
            className="z-[9999] w-[280px] p-3.5 rounded-2xl bg-[#090e17] border border-surface-border/90 shadow-2xl text-left font-mono animate-in fade-in zoom-in-95 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="flex items-center justify-between border-b border-surface-border/60 pb-1.5 mb-2">
              <div className="flex items-center space-x-1.5 text-accent-cyan font-black text-xs">
                <Info className="w-3.5 h-3.5" />
                <span>{title}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-white sm:hidden"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
              {explanation}
            </p>

            <div className="bg-[#111722] p-2 rounded-xl border border-surface-border/80 space-y-1">
              <div className="flex items-center space-x-1 text-accent-green font-bold text-[9px] uppercase tracking-wider">
                <Lightbulb className="w-3 h-3" />
                <span>How to Trade With This:</span>
              </div>
              <p className="text-[10px] text-slate-200 leading-normal">
                {howToUse}
              </p>
            </div>
          </div>
        </>
      )}
    </span>
  );
}
