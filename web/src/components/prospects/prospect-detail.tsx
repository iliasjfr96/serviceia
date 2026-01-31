"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useProspect,
  useUpdateProspect,
  useUpdateProspectStage,
} from "@/hooks/use-prospects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STAGE_LABELS,
  STAGE_COLORS,
  URGENCY_LABELS,
  URGENCY_COLORS,
  SOURCE_LABELS,
  STAGES_ORDER,
} from "@/lib/constants/pipeline";
import { NotesSection } from "./notes-section";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  Clock,
  Loader2,
  Save,
  PhoneCall,
  AlertTriangle,
} from "lucide-react";

interface ProspectDetailProps {
  prospectId: string;
}

export function ProspectDetail({ prospectId }: ProspectDetailProps) {
  const router = useRouter();
  const { data: prospect, isLoading, error } = useProspect(prospectId);
  const updateMutation = useUpdateProspect();
  const stageMutation = useUpdateProspectStage();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !prospect) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Prospect non trouve</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Retour
        </Button>
      </div>
    );
  }

  const fullName =
    [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") ||
    "Sans nom";

  function startEditing() {
    setEditForm({
      firstName: prospect.firstName || "",
      lastName: prospect.lastName || "",
      email: prospect.email || "",
      phone: prospect.phone || "",
      alternatePhone: prospect.alternatePhone || "",
      address: prospect.address || "",
      city: prospect.city || "",
      postalCode: prospect.postalCode || "",
      caseDescription: prospect.caseDescription || "",
      referralSource: prospect.referralSource || "",
    });
    setIsEditing(true);
  }

  function handleSave() {
    updateMutation.mutate(
      { id: prospectId, data: editForm },
      {
        onSuccess: () => {
          setIsEditing(false);
          toast.success("Prospect mis a jour");
        },
        onError: () => toast.error("Erreur lors de la mise a jour"),
      }
    );
  }

  function handleStageChange(newStage: string) {
    stageMutation.mutate(
      { id: prospectId, stage: newStage },
      {
        onSuccess: () => toast.success("Statut mis a jour"),
        onError: () => toast.error("Erreur lors du changement de statut"),
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                className={STAGE_COLORS[prospect.stage] || ""}
              >
                {STAGE_LABELS[prospect.stage] || prospect.stage}
              </Badge>
              <Badge
                variant="secondary"
                className={URGENCY_COLORS[prospect.urgencyLevel] || ""}
              >
                {URGENCY_LABELS[prospect.urgencyLevel] || prospect.urgencyLevel}
              </Badge>
              {prospect.isEmergency && (
                <Badge variant="destructive">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Urgence
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={prospect.stage} onValueChange={handleStageChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES_ORDER.map((s) => (
                <SelectItem key={s} value={s}>
                  {STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {prospect._count?.calls ?? 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Appels</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {prospect._count?.appointments ?? 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">RDV</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {prospect._count?.notes ?? 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Notes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${prospect.leadScore}%` }}
                  />
                </div>
                <span className="text-2xl font-bold">{prospect.leadScore}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="timeline">Historique</TabsTrigger>
          <TabsTrigger value="notes">
            Notes ({prospect._count?.notes ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Coordonnees</CardTitle>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Enregistrer
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  Modifier
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Prenom</Label>
                    <Input
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, firstName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, lastName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telephone</Label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, phone: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, email: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telephone secondaire</Label>
                    <Input
                      value={editForm.alternatePhone}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          alternatePhone: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Adresse</Label>
                    <Input
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, address: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Input
                      value={editForm.city}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, city: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Code postal</Label>
                    <Input
                      value={editForm.postalCode}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          postalCode: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Description du dossier</Label>
                    <Textarea
                      value={editForm.caseDescription}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          caseDescription: e.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoField
                    icon={<Phone className="h-4 w-4" />}
                    label="Telephone"
                    value={prospect.phone}
                  />
                  <InfoField
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    value={prospect.email}
                  />
                  {prospect.alternatePhone && (
                    <InfoField
                      icon={<Phone className="h-4 w-4" />}
                      label="Tel. secondaire"
                      value={prospect.alternatePhone}
                    />
                  )}
                  {(prospect.address || prospect.city) && (
                    <InfoField
                      icon={<MapPin className="h-4 w-4" />}
                      label="Adresse"
                      value={[
                        prospect.address,
                        [prospect.postalCode, prospect.city]
                          .filter(Boolean)
                          .join(" "),
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    />
                  )}
                  <InfoField
                    icon={<FileText className="h-4 w-4" />}
                    label="Source"
                    value={SOURCE_LABELS[prospect.source] || prospect.source}
                  />
                  {prospect.referralSource && (
                    <InfoField
                      label="Recommande par"
                      value={prospect.referralSource}
                    />
                  )}
                  {prospect.practiceArea && (
                    <InfoField
                      label="Domaine juridique"
                      value={prospect.practiceArea.name}
                    />
                  )}
                  <InfoField
                    icon={<Clock className="h-4 w-4" />}
                    label="Cree"
                    value={formatDistanceToNow(new Date(prospect.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {prospect.caseDescription && !isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description du dossier</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {prospect.caseDescription}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appels recents</CardTitle>
            </CardHeader>
            <CardContent>
              {prospect.calls && prospect.calls.length > 0 ? (
                <div className="space-y-3">
                  {prospect.calls.map(
                    (call: {
                      id: string;
                      direction: string;
                      status: string;
                      duration: number | null;
                      summary: string | null;
                      isEmergency: boolean;
                      createdAt: string;
                    }) => (
                      <div
                        key={call.id}
                        className="flex items-start gap-3 p-3 rounded-lg border"
                      >
                        <PhoneCall
                          className={`h-4 w-4 mt-1 ${
                            call.direction === "INBOUND"
                              ? "text-green-500"
                              : "text-blue-500"
                          }`}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {call.direction === "INBOUND"
                                ? "Appel entrant"
                                : "Appel sortant"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(call.createdAt), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                          </div>
                          {call.duration && (
                            <p className="text-xs text-muted-foreground">
                              Duree: {Math.floor(call.duration / 60)}min{" "}
                              {call.duration % 60}s
                            </p>
                          )}
                          {call.summary && (
                            <p className="text-sm text-muted-foreground">
                              {call.summary}
                            </p>
                          )}
                          {call.isEmergency && (
                            <Badge variant="destructive" className="mt-1">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Urgence detectee
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun appel enregistre
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rendez-vous</CardTitle>
            </CardHeader>
            <CardContent>
              {prospect.appointments && prospect.appointments.length > 0 ? (
                <div className="space-y-3">
                  {prospect.appointments.map(
                    (apt: {
                      id: string;
                      title: string;
                      startTime: string;
                      endTime: string;
                      status: string;
                      bookedBy: string;
                    }) => (
                      <div
                        key={apt.id}
                        className="flex items-start gap-3 p-3 rounded-lg border"
                      >
                        <Calendar className="h-4 w-4 mt-1 text-purple-500" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {apt.title}
                            </span>
                            <Badge variant="outline">{apt.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(apt.startTime), "dd/MM/yyyy HH:mm", {
                              locale: fr,
                            })}{" "}
                            -{" "}
                            {format(new Date(apt.endTime), "HH:mm", {
                              locale: fr,
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Reserve par:{" "}
                            {apt.bookedBy === "AI_AGENT" ? "Agent IA" : "Manuel"}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun rendez-vous
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <NotesSection
                prospectId={prospectId}
                notes={prospect.notes || []}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoField({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      {icon && (
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
      )}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}
