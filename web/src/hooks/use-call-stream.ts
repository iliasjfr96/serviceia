import { useEffect, useState, useCallback, useRef } from "react";

interface StreamCall {
  id: string;
  status: string;
  transcriptRaw?: string | null;
  duration?: number | null;
  isEmergency: boolean;
  emergencyType?: string | null;
  startedAt?: string | null;
  callerNumber?: string | null;
  prospect?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

interface StreamEvent {
  type: "connected" | "calls" | "call_ended" | "error";
  calls?: StreamCall[];
  callId?: string;
  status?: string;
  message?: string;
  timestamp?: number;
}

interface UseCallStreamOptions {
  callId?: string;
  enabled?: boolean;
  onCallEnded?: (callId: string, status: string) => void;
  onEmergency?: (call: StreamCall) => void;
}

export function useCallStream(options: UseCallStreamOptions = {}) {
  const { callId, enabled = true, onCallEnded, onEmergency } = options;
  const [calls, setCalls] = useState<StreamCall[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const previousEmergenciesRef = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = callId
      ? `/api/v1/calls/stream?callId=${callId}`
      : "/api/v1/calls/stream";

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);

        switch (data.type) {
          case "connected":
            setIsConnected(true);
            break;

          case "calls":
            if (data.calls) {
              setCalls(data.calls);

              // Check for new emergencies
              data.calls.forEach((call) => {
                if (
                  call.isEmergency &&
                  !previousEmergenciesRef.current.has(call.id)
                ) {
                  previousEmergenciesRef.current.add(call.id);
                  onEmergency?.(call);
                }
              });
            }
            break;

          case "call_ended":
            if (data.callId && data.status) {
              onCallEnded?.(data.callId, data.status);
            }
            break;

          case "error":
            setError(data.message || "Stream error");
            break;
        }
      } catch (err) {
        console.error("[useCallStream] Parse error:", err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError("Connection lost");
      // EventSource will auto-reconnect
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [callId, onCallEnded, onEmergency]);

  useEffect(() => {
    if (!enabled) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsConnected(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCalls([]);
      return;
    }

    const cleanup = connect();
    return cleanup;
  }, [enabled, connect]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
    setCalls([]);
  }, []);

  return {
    calls,
    isConnected,
    error,
    disconnect,
    reconnect: connect,
  };
}
