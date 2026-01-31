"use client";

import { useEffect } from "react";
import {
  useIntegrations,
  useIntegrationStatus,
  useUpdateIntegration,
  useDeleteIntegration,
} from "@/hooks/use-integrations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Loader2,
  Link2,
  Calendar,
  Mail,
  MessageSquare,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

interface Integration {
  id: string;
  provider: "GOOGLE";
  accountEmail: string;
  calendarId: string | null;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  syncErrors: number;
  createdAt: string;
  updatedAt: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Connexion refusee par l'utilisateur",
  invalid_request: "Requete invalide (code ou state manquant)",
  invalid_state: "Erreur de securite (state invalide ou expire)",
  session_mismatch: "Erreur de securite (session ne correspond pas)",
  callback_failed: "Erreur lors de la connexion",
  connection_failed: "Impossible de se connecter a Google",
  not_configured: "Google Calendar non configure (variables d'environnement manquantes)",
};

export default function IntegrationsPage() {
  const { data: integrations, isLoading } = useIntegrations();
  const { data: status } = useIntegrationStatus();
  const updateMutation = useUpdateIntegration();
  const deleteMutation = useDeleteIntegration();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Handle OAuth callback feedback
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "google") {
      toast.success("Google Calendar connecte avec succes");
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["integration-status"] });
      window.history.replaceState({}, "", "/parametres/integrations");
    } else if (error) {
      toast.error(ERROR_MESSAGES[error] || "Erreur de connexion");
      window.history.replaceState({}, "", "/parametres/integrations");
    }
  }, [searchParams, queryClient]);

  function handleToggleSync(integration: Integration) {
    updateMutation.mutate(
      { id: integration.id, syncEnabled: !integration.syncEnabled },
      {
        onSuccess: () =>
          toast.success(
            integration.syncEnabled
              ? "Synchronisation desactivee"
              : "Synchronisation activee"
          ),
        onError: () => toast.error("Erreur mise a jour"),
      }
    );
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success("Integration supprimee");
        setDeleteId(null);
      },
      onError: () => toast.error("Erreur suppression"),
    });
  }

  function handleConnectGoogle() {
    window.location.href = "/api/integrations/google/connect";
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const integrationList: Integration[] = integrations || [];
  const googleConnected = !!status?.google;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/parametres">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connectez vos outils pour synchroniser calendrier, emails et SMS
          </p>
        </div>
      </div>

      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Google Calendar
          </CardTitle>
          <CardDescription>
            Synchronisez vos rendez-vous avec Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrationList.length === 0 ? (
            <div className="text-center py-8">
              <Link2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Aucune integration calendrier configuree
              </p>
              <Button onClick={handleConnectGoogle}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connecter Google Calendar
              </Button>
            </div>
          ) : (
            integrationList.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Google Calendar</p>
                    <p className="text-xs text-muted-foreground">
                      {integration.accountEmail}
                    </p>
                    {integration.lastSyncAt && (
                      <p className="text-xs text-muted-foreground">
                        Derniere sync:{" "}
                        {new Date(integration.lastSyncAt).toLocaleString("fr")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {integration.syncErrors > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {integration.syncErrors} erreurs
                    </Badge>
                  )}
                  <Badge
                    variant={integration.syncEnabled ? "default" : "secondary"}
                  >
                    {integration.syncEnabled ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {integration.syncEnabled ? "Active" : "Inactive"}
                  </Badge>
                  <Switch
                    checked={integration.syncEnabled}
                    onCheckedChange={() => handleToggleSync(integration)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(integration.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}

          {/* Reconnect button when already connected */}
          {integrationList.length > 0 && googleConnected && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnectGoogle}
              >
                <ExternalLink className="h-3 w-3 mr-2" />
                Reconnecter Google Calendar
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Utilisez cette option si vos tokens ont expire ou en cas
                d&apos;erreurs de synchronisation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email & SMS (informational) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Email (Resend)
          </CardTitle>
          <CardDescription>
            Service d&apos;envoi d&apos;emails pour les relances et rappels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Resend</p>
                <p className="text-xs text-muted-foreground">
                  Configure via les variables d&apos;environnement
                </p>
              </div>
            </div>
            <Badge variant="outline">
              {process.env.NEXT_PUBLIC_RESEND_CONFIGURED === "true"
                ? "Configure"
                : "Variable d'env requise"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> SMS (Twilio)
          </CardTitle>
          <CardDescription>
            Service SMS pour les rappels de rendez-vous et notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Twilio</p>
                <p className="text-xs text-muted-foreground">
                  Configure via les variables d&apos;environnement
                </p>
              </div>
            </div>
            <Badge variant="outline">
              {process.env.NEXT_PUBLIC_TWILIO_CONFIGURED === "true"
                ? "Configure"
                : "Variable d'env requise"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer cette integration ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              La synchronisation calendrier sera arretee. Les rendez-vous
              existants ne seront pas affectes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
