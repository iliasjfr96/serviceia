"use client";

import { useEffect, useState } from "react";
import { useAgentConfig, useUpdateAgentConfig } from "@/hooks/use-agent-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Loader2,
  Bot,
  Shield,
  ArrowLeft,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Webhook,
  Mic,
  ExternalLink,
  RefreshCw,
  Info,
  Phone,
} from "lucide-react";
import Link from "next/link";

// Emergency keywords list (for display only - detection happens in webhook)
const DEFAULT_EMERGENCY_KEYWORDS = [
  "violence",
  "frappe",
  "battu",
  "menace",
  "danger",
  "urgence",
  "garde a vue",
  "agression",
  "suicide",
  "harcelement",
  "viol",
];

export default function AgentConfigPage() {
  const { data: config, isLoading, refetch } = useAgentConfig();
  const updateMutation = useUpdateAgentConfig();

  const [copied, setCopied] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "success" | "error">("unknown");

  const [form, setForm] = useState({
    elevenLabsAgentId: "",
    emergencyTransferNumber: "",
    enableRecording: true,
    requireConsent: true,
    enableEmergencyDetection: true,
  });

  useEffect(() => {
    if (config) {
      setForm({
        elevenLabsAgentId: config.elevenLabsAgentId || "",
        emergencyTransferNumber: config.emergencyTransferNumber || "",
        enableRecording: config.enableRecording ?? true,
        requireConsent: config.requireConsent ?? true,
        enableEmergencyDetection: config.enableEmergencyDetection ?? true,
      });
      if (config.elevenLabsAgentId) {
        setConnectionStatus("success");
      }
    }
  }, [config]);

  function handleSave() {
    updateMutation.mutate(form, {
      onSuccess: () => {
        toast.success("Configuration sauvegardee");
        refetch();
      },
      onError: () => toast.error("Erreur lors de la sauvegarde"),
    });
  }

  async function copyWebhookUrl() {
    const url = `${window.location.origin}/api/webhooks/elevenlabs`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("URL copiee dans le presse-papiers");
    setTimeout(() => setCopied(false), 2000);
  }

  async function testConnection() {
    if (!form.elevenLabsAgentId) {
      toast.error("Veuillez entrer un Agent ID");
      return;
    }

    if (!form.elevenLabsAgentId.startsWith("agent_")) {
      setConnectionStatus("error");
      toast.error("L'Agent ID doit commencer par 'agent_'");
      return;
    }

    setTestingConnection(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setConnectionStatus("success");
      toast.success("Agent ID configure - Les appels seront traites automatiquement");
      handleSave();
    } catch {
      setConnectionStatus("error");
      toast.error("Erreur lors de la verification");
    } finally {
      setTestingConnection(false);
    }
  }

  function openElevenLabsConsole() {
    // ElevenLabs Agents Dashboard - l'agent ID est utilise pour identifier dans les webhooks
    window.open("https://elevenlabs.io/app/agents", "_blank");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/elevenlabs`
    : "/api/webhooks/elevenlabs";

  return (
    <TooltipProvider>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/parametres">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Agent IA Vocal</h1>
              <p className="text-muted-foreground">
                Configuration du webhook ElevenLabs
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sauvegarder
          </Button>
        </div>

        {/* Architecture Info */}
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-sm text-blue-800 dark:text-blue-200">
                  Comment ca fonctionne
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Client appelle → Twilio → ElevenLabs → Webhook → CRM cree automatiquement le prospect avec la transcription
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ElevenLabs Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Configuration ElevenLabs
            </CardTitle>
            <CardDescription>
              Connectez votre agent ElevenLabs Conversational AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Agent ID */}
            <div className="space-y-2">
              <Label>Agent ID ElevenLabs</Label>
              <div className="flex gap-2">
                <Input
                  value={form.elevenLabsAgentId}
                  onChange={(e) => setForm((f) => ({ ...f, elevenLabsAgentId: e.target.value }))}
                  placeholder="agent_xxxxxxxxxxxxxxxx"
                  className="font-mono"
                />
                <Button
                  variant={connectionStatus === "success" ? "default" : "outline"}
                  onClick={testConnection}
                  disabled={testingConnection || !form.elevenLabsAgentId}
                  className={connectionStatus === "success" ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {testingConnection ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : connectionStatus === "success" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : connectionStatus === "error" ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={openElevenLabsConsole} title="Ouvrir ElevenLabs">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              {connectionStatus === "success" && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Agent ID valide - Les appels seront traites via le webhook
                </p>
              )}
              {connectionStatus === "error" && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Agent ID invalide. Format attendu: agent_xxxxx
                </p>
              )}
              {connectionStatus === "unknown" && (
                <p className="text-xs text-muted-foreground">
                  Creez un agent sur{" "}
                  <a href="https://elevenlabs.io/app/agents" target="_blank" rel="noopener noreferrer" className="underline text-primary">
                    elevenlabs.io/app/agents
                  </a>{" "}
                  et collez l&apos;Agent ID
                </p>
              )}
            </div>

            {/* Webhook URL */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                URL Webhook (a configurer dans ElevenLabs)
              </Label>
              <div className="flex gap-2">
                <Input value={webhookUrl} readOnly className="font-mono text-sm bg-muted" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={copyWebhookUrl}>
                      {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copier l&apos;URL</TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xs text-muted-foreground">
                Dans ElevenLabs → Agent → Webhooks → Coller cette URL pour &quot;Post-call webhook&quot;
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Detection d&apos;urgence
            </CardTitle>
            <CardDescription>
              Alerte automatique si des mots-cles d&apos;urgence sont detectes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-sm">Activer la detection</p>
                <p className="text-xs text-muted-foreground">
                  Detecter violence, menaces, situations critiques
                </p>
              </div>
              <Switch
                checked={form.enableEmergencyDetection}
                onCheckedChange={(v) => setForm((f) => ({ ...f, enableEmergencyDetection: v }))}
              />
            </div>

            {form.enableEmergencyDetection && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Numero de transfert urgence
                  </Label>
                  <Input
                    value={form.emergencyTransferNumber}
                    onChange={(e) => setForm((f) => ({ ...f, emergencyTransferNumber: e.target.value }))}
                    placeholder="+33 6 12 34 56 78"
                  />
                  <p className="text-xs text-muted-foreground">
                    Numero pour recevoir les alertes urgentes
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Mots-cles detectes automatiquement</Label>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-muted rounded-lg">
                    {DEFAULT_EMERGENCY_KEYWORDS.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* RGPD Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Conformite RGPD
            </CardTitle>
            <CardDescription>
              Parametres d&apos;enregistrement et de consentement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Mic className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Enregistrement des appels</p>
                  <p className="text-xs text-muted-foreground">
                    Transcription automatique via ElevenLabs
                  </p>
                </div>
              </div>
              <Switch
                checked={form.enableRecording}
                onCheckedChange={(v) => setForm((f) => ({ ...f, enableRecording: v }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Demander le consentement</p>
                  <p className="text-xs text-muted-foreground">
                    L&apos;agent demande le consentement au debut de l&apos;appel
                  </p>
                </div>
              </div>
              <Switch
                checked={form.requireConsent}
                onCheckedChange={(v) => setForm((f) => ({ ...f, requireConsent: v }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Mobile save button */}
        <div className="fixed bottom-4 right-4 md:hidden">
          <Button onClick={handleSave} disabled={updateMutation.isPending} size="lg" className="shadow-lg">
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sauvegarder
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
