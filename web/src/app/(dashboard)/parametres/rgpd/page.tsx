"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  Download,
  Trash2,
  Clock,
  Users,
  FileCheck,
  AlertTriangle,
  Save,
  ChevronLeft,
  ChevronRight,
  Search,
  Eraser,
} from "lucide-react";
import {
  useRgpdStats,
  useRetentionSettings,
  useUpdateRetentionSettings,
  useConsentRecords,
  useRevokeConsent,
  useExportProspectData,
  useEraseProspectData,
  useCleanupExpiredData,
} from "@/hooks/use-rgpd";
import Link from "next/link";

// ── Retention Settings Form ──────────────────────────────

function RetentionSettingsForm() {
  const { data: settings, isLoading } = useRetentionSettings();
  const updateSettings = useUpdateRetentionSettings();

  const [retentionDays, setRetentionDays] = useState<string>("");
  const [contactEmail, setContactEmail] = useState("");
  const [dpoName, setDpoName] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Initialize form with current values
  if (settings && !initialized) {
    setRetentionDays(String(settings.dataRetentionDays ?? 730));
    setContactEmail(settings.rgpdContactEmail ?? "");
    setDpoName(settings.dpoName ?? "");
    setInitialized(true);
  }

  const handleSave = () => {
    updateSettings.mutate({
      dataRetentionDays: parseInt(retentionDays) || 730,
      rgpdContactEmail: contactEmail || undefined,
      dpoName: dpoName || undefined,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Chargement des parametres...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Politique de retention</CardTitle>
        <CardDescription>
          Configurez la duree de conservation des donnees et les contacts RGPD.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="retention-days">
              Duree de retention (jours)
            </Label>
            <Input
              id="retention-days"
              type="number"
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              min={30}
              max={3650}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {parseInt(retentionDays) > 0
                ? `${Math.round(parseInt(retentionDays) / 365 * 10) / 10} ans`
                : ""}
            </p>
          </div>

          <div>
            <Label htmlFor="dpo-name">Nom du DPO</Label>
            <Input
              id="dpo-name"
              value={dpoName}
              onChange={(e) => setDpoName(e.target.value)}
              placeholder="Delegue a la protection des donnees"
            />
          </div>

          <div>
            <Label htmlFor="contact-email">Email de contact RGPD</Label>
            <Input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="rgpd@cabinet.fr"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
        >
          <Save className="mr-2 h-4 w-4" />
          {updateSettings.isPending
            ? "Enregistrement..."
            : "Enregistrer"}
        </Button>
        {updateSettings.isSuccess && (
          <span className="text-sm text-green-600 ml-3">
            Parametres enregistres
          </span>
        )}
      </CardContent>
    </Card>
  );
}

// ── Data Management (Export & Erasure) ──────────────────

function DataManagement() {
  const [prospectId, setProspectId] = useState("");
  const exportData = useExportProspectData();
  const eraseData = useEraseProspectData();
  const cleanup = useCleanupExpiredData();

  const handleExport = () => {
    if (!prospectId) return;
    exportData.mutate(prospectId, {
      onSuccess: (data) => {
        // Download as JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export-rgpd-${prospectId.slice(0, 8)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  };

  const handleErase = () => {
    if (!prospectId) return;
    eraseData.mutate(prospectId, {
      onSuccess: () => {
        setProspectId("");
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Prospect search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Portabilite & Droit a l&apos;oubli
          </CardTitle>
          <CardDescription>
            Exportez ou effacez les donnees d&apos;un prospect conformement au
            RGPD.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="prospect-search">ID du prospect</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="prospect-search"
                  value={prospectId}
                  onChange={(e) => setProspectId(e.target.value)}
                  placeholder="Collez l'identifiant du prospect"
                  className="pl-9"
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleExport}
              disabled={!prospectId || exportData.isPending}
            >
              <Download className="mr-2 h-4 w-4" />
              {exportData.isPending ? "Export..." : "Exporter (JSON)"}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={!prospectId || eraseData.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {eraseData.isPending ? "Effacement..." : "Effacer"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Confirmer l&apos;effacement
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irreversible. Toutes les donnees
                    personnelles du prospect seront anonymisees. Les
                    statistiques agregees seront conservees.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleErase}>
                    Confirmer l&apos;effacement
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {exportData.isError && (
            <p className="text-sm text-destructive">
              {exportData.error.message}
            </p>
          )}
          {eraseData.isSuccess && (
            <p className="text-sm text-green-600">
              Donnees effacees avec succes.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Nettoyage des donnees expirees
          </CardTitle>
          <CardDescription>
            Anonymisez automatiquement les prospects dont la periode de
            retention a expire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={cleanup.isPending}>
                  <Eraser className="mr-2 h-4 w-4" />
                  {cleanup.isPending
                    ? "Nettoyage en cours..."
                    : "Lancer le nettoyage"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer le nettoyage</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tous les prospects dont la date de creation depasse la duree
                    de retention configuree seront anonymises. Cette action est
                    irreversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => cleanup.mutate()}>
                    Lancer le nettoyage
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {cleanup.isSuccess && (
              <span className="text-sm text-green-600">
                {(cleanup.data as { cleaned: number })?.cleaned ?? 0} prospect(s)
                anonymise(s)
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ──────────────────────────────

export default function RgpdPage() {
  const { data: stats } = useRgpdStats();
  const [consentPage, setConsentPage] = useState(1);
  const { data: consentsData, isLoading: consentsLoading } =
    useConsentRecords({ page: consentPage, limit: 15 });
  const revokeConsent = useRevokeConsent();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const consentsList = (consentsData as any)?.records || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const consentsPagination = (consentsData as any)?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/parametres"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Parametres
            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm">RGPD</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Conformite RGPD
          </h1>
          <p className="text-muted-foreground">
            Gestion des consentements, retention des donnees et droits des
            personnes
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Taux de consentement
            </CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.consentRate ?? 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.withConsent ?? 0} sur {stats?.totalProspects ?? 0}{" "}
              prospects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Consentements actifs
            </CardTitle>
            <FileCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeConsents ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.revokedConsents ?? 0} revoques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Retention expiree
            </CardTitle>
            {(stats?.expiredRetention ?? 0) > 0 ? (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.expiredRetention ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              prospect(s) a nettoyer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Entrees d&apos;audit
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalAuditEntries ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              retention : {stats?.retentionDays ?? 730} jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="retention">
        <TabsList>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="data">Donnees</TabsTrigger>
          <TabsTrigger value="consents">Consentements</TabsTrigger>
        </TabsList>

        {/* ── Retention Tab ──────────────────────────────── */}
        <TabsContent value="retention" className="space-y-4">
          <RetentionSettingsForm />
        </TabsContent>

        {/* ── Data Management Tab ──────────────────────────── */}
        <TabsContent value="data" className="space-y-4">
          <DataManagement />
        </TabsContent>

        {/* ── Consents Tab ──────────────────────────────── */}
        <TabsContent value="consents" className="space-y-4">
          {consentsLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Chargement des consentements...
              </CardContent>
            </Card>
          ) : consentsList.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun consentement enregistre</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Methode</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Prospect</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consentsList.map(
                      (record: {
                        id: string;
                        grantedAt: string;
                        revokedAt: string | null;
                        consentType: string;
                        method: string;
                        granted: boolean;
                        prospectId: string | null;
                      }) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-sm">
                            {new Date(record.grantedAt).toLocaleString(
                              "fr-FR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.consentType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.method}
                          </TableCell>
                          <TableCell>
                            {record.revokedAt ? (
                              <Badge variant="destructive">Revoque</Badge>
                            ) : record.granted ? (
                              <Badge className="bg-green-100 text-green-800">
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Refuse</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {record.prospectId
                              ? `#${record.prospectId.slice(0, 8)}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {record.granted && !record.revokedAt && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Revoquer ce consentement ?"
                                    )
                                  ) {
                                    revokeConsent.mutate(record.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </Card>

              {/* Pagination */}
              {consentsPagination &&
                consentsPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {consentsPagination.page} sur{" "}
                      {consentsPagination.totalPages} (
                      {consentsPagination.total} enregistrements)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={consentPage <= 1}
                        onClick={() => setConsentPage((p) => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          consentPage >= consentsPagination.totalPages
                        }
                        onClick={() => setConsentPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
