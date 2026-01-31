"use client";

import { Phone } from "lucide-react";

export default function WidgetPage() {
  const openAssistant = () => {
    window.open(
      "https://elevenlabs.io/app/talk-to?agent_id=agent_5201kg5bj2e0fzwrwjv38za70mbc",
      "assistant",
      "width=400,height=700,scrollbars=no,resizable=no"
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="text-center w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Phone className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            Cabinet Martin et Associes
          </h1>
          <p className="text-slate-300 mb-8">
            Parlez a notre assistante virtuelle Sophie
          </p>

          <button
            onClick={openAssistant}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-blue-600/30"
          >
            Demarrer la conversation
          </button>

          <div className="mt-8 space-y-2 text-slate-400 text-sm">
            <p>Disponible 24h/24, 7j/7</p>
            <p>Reponse immediate</p>
            <p>Vos donnees sont protegees (RGPD)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
