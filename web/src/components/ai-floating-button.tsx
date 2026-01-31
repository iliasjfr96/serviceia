"use client";

import { useState } from "react";
import { Mic, X, Phone } from "lucide-react";

const AGENT_URL = "https://elevenlabs.io/app/talk-to?agent_id=agent_5201kg5bj2e0fzwrwjv38za70mbc";

export function AIFloatingButton() {
  const [isHovered, setIsHovered] = useState(false);

  const openAssistant = () => {
    window.open(
      AGENT_URL,
      "assistant",
      "width=420,height=700,scrollbars=no,resizable=yes"
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap">
          <div className="bg-slate-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
            Parler a l&apos;assistant IA
            <div className="absolute top-full right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-900" />
          </div>
        </div>
      )}

      {/* Button */}
      <button
        onClick={openAssistant}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        aria-label="Ouvrir l'assistant IA"
      >
        <Mic className="w-6 h-6" />

        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-25" />
      </button>
    </div>
  );
}
