"use client";

import Script from "next/script";
import { useState } from "react";

interface AIAssistantWidgetProps {
  agentId?: string;
  className?: string;
}

/**
 * ElevenLabs Conversational AI Widget
 *
 * Embeds the ElevenLabs voice AI assistant on any page.
 * The widget handles voice calls and sends data to the webhook.
 *
 * Usage:
 * <AIAssistantWidget />
 * <AIAssistantWidget agentId="custom-agent-id" />
 */
export function AIAssistantWidget({
  agentId = "agent_5201kg5bj2e0fzwrwjv38za70mbc",
  className = ""
}: AIAssistantWidgetProps) {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  return (
    <>
      <Script
        src="https://elevenlabs.io/convai-widget/index.js"
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className={`ai-assistant-widget ${className}`}>
        {/* @ts-expect-error - Custom element from ElevenLabs */}
        <elevenlabs-convai agent-id={agentId}></elevenlabs-convai>

        {!scriptLoaded && (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <svg className="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Chargement de l&apos;assistant...
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Floating button that opens the AI assistant
 * Use this for a less intrusive integration
 */
export function AIAssistantButton({
  agentId = "agent_5201kg5bj2e0fzwrwjv38za70mbc",
}: AIAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Script
        src="https://elevenlabs.io/convai-widget/index.js"
        strategy="lazyOnload"
      />

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        aria-label="Parler a l'assistant"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Widget Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-blue-600 text-white p-4">
            <h3 className="font-semibold">Assistant Virtuel</h3>
            <p className="text-sm text-blue-100">Parlez-moi de votre situation</p>
          </div>
          <div className="p-4">
            {/* @ts-expect-error - Custom element from ElevenLabs */}
            <elevenlabs-convai agent-id={agentId}></elevenlabs-convai>
          </div>
        </div>
      )}
    </>
  );
}
