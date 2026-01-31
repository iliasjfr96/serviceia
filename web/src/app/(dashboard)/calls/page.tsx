"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCalls, useCallStats } from "@/hooks/use-calls";
import { useCallStream } from "@/hooks/use-call-stream";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CALL_STATUS_LABELS,
  CALL_STATUS_COLORS,
  CALL_DIRECTION_LABELS,
} from "@/lib/constants/calls";
import {
  Search,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  AlertTriangle,
  Phone,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BarChart3,
  Radio,
  PhoneCall,
  Mic,
  MicOff,
  User,
  Bot,
  ExternalLink,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAgentConfig } from "@/hooks/use-agent-config";
import { useBrowserNotifications } from "@/hooks/use-notifications";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Call {
  id: string;
  direction: string;
  status: string;
  callerNumber?: string;
  callerName?: string;
  duration?: number;
  summary?: string;
  transcriptRaw?: string;
  isEmergency: boolean;
  emergencyType?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  prospect?: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  } | null;
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Active Calls Monitor ──────────────────────────────

function ActiveCallsMonitor({ onEmergency }: { onEmergency?: (call: Call) => void }) {
  const { calls: streamCalls, isConnected, error } = useCallStream({
    enabled: true,
    onEmergency: onEmergency as ((call: unknown) => void) | undefined,
  });

  // Fallback polling if SSE fails
  const { data, refetch } = useCalls({
    status: "IN_PROGRESS",
    limit: 10,
  });

  useEffect(() => {
    if (!isConnected || error) {
      const interval = setInterval(() => {
        refetch();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, error, refetch]);

  // Use SSE data if connected, otherwise use polling data
  const activeCalls = isConnected && streamCalls.length > 0
    ? streamCalls as unknown as Call[]
    : (data?.calls ?? []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <span
          className={`h-2 w-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-yellow-500"
          }`}
        />
        {isConnected ? "Flux temps reel actif" : "Mode polling (5s)"}
        {error && <span className="text-red-500">({error})</span>}
      </div>

      {activeCalls.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Radio className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun appel en cours</p>
              <p className="text-sm mt-1">
                Les appels actifs apparaitront ici en temps reel
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        activeCalls.map((call: Call) => (
          <ActiveCallCard key={call.id} call={call} />
        ))
      )}
    </div>
  );
}

function ActiveCallCard({ call }: { call: Call }) {
  const [elapsed, setElapsed] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  const prevTranscriptRef = useRef<string | null>(null);

  useEffect(() => {
    const startTime = call.startedAt
      ? new Date(call.startedAt).getTime()
      : new Date(call.createdAt).getTime();

    const updateElapsed = () => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [call.startedAt, call.createdAt]);

  // Show typing indicator when transcript updates
  useEffect(() => {
    if (call.transcriptRaw !== prevTranscriptRef.current) {
      prevTranscriptRef.current = call.transcriptRaw ?? null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowTyping(true);
      const timeout = setTimeout(() => setShowTyping(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [call.transcriptRaw]);

  const transcriptLines = call.transcriptRaw?.split("\n").filter(Boolean) ?? [];
  const lastLines = transcriptLines.slice(-4);

  return (
    <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <PhoneCall className="h-8 w-8 text-green-600 animate-pulse" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-ping" />
            </div>
            <div>
              <p className="font-medium">
                {call.prospect
                  ? [call.prospect.firstName, call.prospect.lastName]
                      .filter(Boolean)
                      .join(" ") || call.callerNumber
                  : call.callerNumber || "Appelant inconnu"}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(elapsed)}
                </span>
                {call.isEmergency && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Urgence
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <Mic className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        </div>

        <div className="mt-3 p-2 bg-white/80 dark:bg-black/20 rounded-md text-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-muted-foreground text-xs">
              Transcription en direct:
            </p>
            {showTyping && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 bg-green-500 rounded-full animate-bounce" />
                <span className="inline-block h-1.5 w-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="inline-block h-1.5 w-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </span>
            )}
          </div>

          {lastLines.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              En attente de la conversation...
            </p>
          ) : (
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {lastLines.map((line, i) => {
                const isAgent = line.startsWith("Agent:");
                const isLatest = i === lastLines.length - 1;
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-2 ${
                      isLatest ? "opacity-100" : "opacity-70"
                    } ${isAgent ? "" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs max-w-[85%] ${
                        isAgent
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {isAgent ? (
                        <Bot className="h-3 w-3 shrink-0" />
                      ) : (
                        <User className="h-3 w-3 shrink-0" />
                      )}
                      <span>{line.replace(/^(Agent|Client):/, "").trim()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


// ── Test Call Dialog ──────────────────────────────

function TestCallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: agentConfig } = useAgentConfig();
  const testUrl = agentConfig?.voiceId
    ? `https://elevenlabs.io/app/conversational-ai/${agentConfig.voiceId}/call`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5" />
            Tester l&apos;agent vocal
          </DialogTitle>
          <DialogDescription>
            Effectuez un appel de test pour verifier la configuration de votre
            agent IA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!agentConfig?.voiceId ? (
            <div className="text-center py-6">
              <MicOff className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Agent non configure</p>
              <p className="text-sm text-muted-foreground mt-1">
                Configurez d&apos;abord l&apos;Agent ID ElevenLabs dans les
                parametres
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <a href="/parametres/agent">Configurer l&apos;agent</a>
              </Button>
            </div>
          ) : (
            <>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Agent configure:</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Nom: {agentConfig.agentName || "Sophie"}</p>
                  <p>Langue: {agentConfig.primaryLanguage || "fr"}</p>
                  <p>Agent ID: {agentConfig.voiceId?.slice(0, 20)}...</p>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  window.open(testUrl, "_blank");
                  toast.success("Ouverture du test ElevenLabs...");
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Tester sur ElevenLabs
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Ouvre l&apos;interface de test ElevenLabs dans un nouvel onglet
              </p>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Les appels de test apparaitront dans
                  l&apos;historique une fois termines.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────

export default function CallsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [direction, setDirection] = useState<string>("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("live");

  const { data: stats, refetch: refetchStats } = useCallStats();
  const { notify } = useBrowserNotifications();

  // Handle emergency detection from stream
  const handleEmergency = useCallback((call: Call) => {
    const callerName = call.prospect?.firstName || call.callerNumber || "Appelant";

    // Show toast notification
    toast.error(
      `Urgence detectee: ${callerName}`,
      {
        description: call.emergencyType || "Situation d'urgence signalee",
        duration: 10000,
      }
    );

    // Show browser notification
    notify(`Urgence: ${callerName}`, {
      body: call.emergencyType || "Situation d'urgence signalee",
      tag: `emergency-${call.id}`,
      requireInteraction: true,
      onClick: () => {
        router.push("/calls");
      },
    });

    refetchStats();
  }, [refetchStats, notify, router]);
  const { data, isLoading } = useCalls({
    search: search || undefined,
    status: status || undefined,
    direction: direction || undefined,
    page,
    limit: 25,
  });

  const allCalls: Call[] = data?.calls ?? [];
  // Filter by urgency client-side
  const calls = urgencyFilter
    ? allCalls.filter((c) =>
        urgencyFilter === "URGENT" ? c.isEmergency : !c.isEmergency
      )
    : allCalls;
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0 };
  const hasActiveCalls = stats?.byStatus?.IN_PROGRESS ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appels</h1>
          <p className="text-muted-foreground">
            Appels traites par l&apos;agent IA ElevenLabs
          </p>
        </div>
        <Button onClick={() => setShowTestDialog(true)}>
          <PhoneCall className="h-4 w-4 mr-2" />
          Tester l&apos;agent
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="live" className="relative">
            <Radio className="h-4 w-4 mr-2" />
            En direct
            {hasActiveCalls > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                {hasActiveCalls}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{stats?.total ?? 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <PhoneIncoming className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {stats?.byDirection?.INBOUND ?? 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Entrants</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-500" />
                  <span className="text-2xl font-bold">
                    {stats?.byStatus?.COMPLETED ?? 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Completes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {formatDuration(stats?.avgDuration)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Duree moy.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`h-4 w-4 ${(stats?.emergencies ?? 0) > 0 ? "text-red-500" : "text-muted-foreground"}`}
                  />
                  <span className="text-2xl font-bold">
                    {stats?.emergencies ?? 0}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Urgences</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="h-4 w-4 text-green-500" />
                Appels en cours
                {hasActiveCalls > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {hasActiveCalls} actif{hasActiveCalls > 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActiveCallsMonitor onEmergency={handleEmergency} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v === "ALL" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous</SelectItem>
                {Object.entries(CALL_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={direction}
              onValueChange={(v) => {
                setDirection(v === "ALL" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous</SelectItem>
                {Object.entries(CALL_DIRECTION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={urgencyFilter}
              onValueChange={(v) => {
                setUrgencyFilter(v === "ALL" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Urgence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes</SelectItem>
                <SelectItem value="URGENT">Urgences</SelectItem>
                <SelectItem value="NORMAL">Normaux</SelectItem>
              </SelectContent>
            </Select>
            {(search || status || direction || urgencyFilter) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                  setDirection("");
                  setUrgencyFilter("");
                  setPage(1);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]" />
                  <TableHead>Appelant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Duree</TableHead>
                  <TableHead>Resume</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : calls.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Aucun appel
                    </TableCell>
                  </TableRow>
                ) : (
                  calls.map((call) => (
                    <TableRow
                      key={call.id}
                      className={`cursor-pointer ${call.isEmergency ? "bg-red-50 dark:bg-red-950/20" : ""}`}
                      onClick={() => setSelectedCall(call)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {call.direction === "INBOUND" ? (
                            <PhoneIncoming className="h-4 w-4 text-green-600" />
                          ) : (
                            <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-sm">
                              {call.prospect
                                ? [call.prospect.firstName, call.prospect.lastName]
                                    .filter(Boolean)
                                    .join(" ") || call.callerNumber || "Inconnu"
                                : call.callerNumber || "Inconnu"}
                            </p>
                            {call.prospect && (
                              <p className="text-xs text-muted-foreground">
                                {call.callerNumber}
                              </p>
                            )}
                          </div>
                          {call.isEmergency && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={CALL_STATUS_COLORS[call.status] || ""}
                        >
                          {CALL_STATUS_LABELS[call.status] || call.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDuration(call.duration)}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">
                          {call.summary || "-"}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(call.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {pagination.total} appel{pagination.total > 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCall?.direction === "INBOUND" ? (
                <PhoneIncoming className="h-5 w-5 text-green-600" />
              ) : (
                <PhoneOutgoing className="h-5 w-5 text-blue-600" />
              )}
              Detail de l&apos;appel
              {selectedCall?.isEmergency && (
                <Badge variant="destructive" className="ml-2">
                  Urgence
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedCall && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                {/* AI Summary - Highlighted */}
                {selectedCall.summary && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-primary">Resume IA</p>
                    </div>
                    <p className="text-sm leading-relaxed">
                      {selectedCall.summary}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Appelant</p>
                    {selectedCall.prospect ? (
                      <Link
                        href={`/prospects/${selectedCall.prospect.id}`}
                        className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {[
                          selectedCall.prospect.firstName,
                          selectedCall.prospect.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") || "Prospect"}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <p className="font-medium">
                        {selectedCall.callerNumber || "Inconnu"}
                      </p>
                    )}
                    {selectedCall.callerNumber && selectedCall.prospect && (
                      <p className="text-xs text-muted-foreground">
                        {selectedCall.callerNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Statut</p>
                    <Badge
                      variant="secondary"
                      className={CALL_STATUS_COLORS[selectedCall.status] || ""}
                    >
                      {CALL_STATUS_LABELS[selectedCall.status] ||
                        selectedCall.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duree</p>
                    <p>{formatDuration(selectedCall.duration)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p>{formatDate(selectedCall.createdAt)}</p>
                  </div>
                </div>

                {selectedCall.isEmergency && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium text-sm">Appel urgent</span>
                    </div>
                    {selectedCall.emergencyType && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        Type: {selectedCall.emergencyType}
                      </p>
                    )}
                  </div>
                )}

                {selectedCall.transcriptRaw && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Transcription complete
                    </p>
                    <div className="p-3 bg-muted rounded-lg space-y-2 text-sm max-h-[250px] overflow-y-auto">
                      {selectedCall.transcriptRaw
                        .split("\n")
                        .filter(Boolean)
                        .map((line, i) => {
                          const isAgent = line.startsWith("Agent:");
                          return (
                            <div
                              key={i}
                              className={`flex items-start gap-2 ${isAgent ? "" : "flex-row-reverse"}`}
                            >
                              <div
                                className={`flex items-start gap-2 px-3 py-2 rounded-lg max-w-[85%] ${
                                  isAgent
                                    ? "bg-primary/10 text-primary"
                                    : "bg-background"
                                }`}
                              >
                                {isAgent ? (
                                  <Bot className="h-4 w-4 mt-0.5 shrink-0" />
                                ) : (
                                  <User className="h-4 w-4 mt-0.5 shrink-0" />
                                )}
                                <span>
                                  {line.replace(/^(Agent|Client):/, "").trim()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Link to prospect */}
                {selectedCall.prospect && (
                  <div className="pt-2 border-t">
                    <Link
                      href={`/prospects/${selectedCall.prospect.id}`}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <User className="h-4 w-4" />
                      Voir la fiche prospect
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <TestCallDialog open={showTestDialog} onOpenChange={setShowTestDialog} />
    </div>
  );
}
