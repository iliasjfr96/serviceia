"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Lazy load heavy TipTap editor (~150KB)
const EmailTemplateEditor = dynamic(
  () => import("@/components/email-template-editor").then((mod) => mod.EmailTemplateEditor),
  {
    loading: () => <div className="h-48 animate-pulse bg-muted rounded-lg" />,
    ssr: false,
  }
);

const EmailTemplatePreview = dynamic(
  () => import("@/components/email-template-editor").then((mod) => mod.EmailTemplatePreview),
  {
    loading: () => <div className="h-48 animate-pulse bg-muted rounded-lg" />,
    ssr: false,
  }
);
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
import { toast } from "sonner";
import {
  Zap,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Megaphone,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Users,
  Mail,
  MessageSquare,
  Search,
  X,
  Loader2,
  ListPlus,
  Eye,
  FileText,
  Star,
  Copy,
} from "lucide-react";
import {
  useAutomationRules,
  useAutomationStats,
  useCreateAutomationRule,
  useToggleAutomationRule,
  useDeleteAutomationRule,
  useAutomationLogs,
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
} from "@/hooks/use-automations";
import {
  useProspectLists,
  useProspectList,
  useCreateProspectList,
  useDeleteProspectList,
  useAddToProspectList,
  useRemoveFromProspectList,
  useSearchProspectsForList,
} from "@/hooks/use-prospect-lists";
import {
  AUTOMATION_TYPE_LABELS,
  AUTOMATION_ACTION_LABELS,
  AUTOMATION_LOG_STATUS_LABELS,
  AUTOMATION_LOG_STATUS_COLORS,
  CAMPAIGN_TYPE_LABELS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_COLORS,
  CAMPAIGN_CHANNEL_LABELS,
  AUTOMATION_TEMPLATES,
} from "@/lib/constants/automations";
import {
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  EMAIL_TEMPLATE_CATEGORIES,
  type EmailTemplate,
} from "@/hooks/use-email-templates";

// ── Create Rule Dialog ──────────────────────────────

function CreateRuleDialog() {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [actionType, setActionType] = useState("");
  const createRule = useCreateAutomationRule();

  const handleTemplateSelect = (index: number) => {
    const template = AUTOMATION_TEMPLATES[index];
    setSelectedTemplate(index);
    setName(template.name);
    setType(template.type);
    setActionType(template.actionType);
  };

  const handleSubmit = () => {
    if (!name || !type || !actionType) return;

    const template =
      selectedTemplate !== null ? AUTOMATION_TEMPLATES[selectedTemplate] : null;

    createRule.mutate(
      {
        name,
        description: description || undefined,
        type,
        actionType,
        triggerConfig: template?.triggerConfig || {},
        actionConfig: template?.actionConfig || {},
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setDescription("");
          setType("");
          setActionType("");
          setSelectedTemplate(null);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle regle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Creer une regle d&apos;automatisation</DialogTitle>
          <DialogDescription>
            Choisissez un modele ou creez une regle personnalisee.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Templates */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Modeles predefinis
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {AUTOMATION_TEMPLATES.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleTemplateSelect(index)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    selectedTemplate === index
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {AUTOMATION_TYPE_LABELS[template.type]} &middot;{" "}
                    {AUTOMATION_ACTION_LABELS[template.actionType]}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <Label htmlFor="rule-name">Nom</Label>
              <Input
                id="rule-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom de la regle"
              />
            </div>

            <div>
              <Label htmlFor="rule-description">Description (optionnel)</Label>
              <Textarea
                id="rule-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de la regle"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AUTOMATION_TYPE_LABELS).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Action</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AUTOMATION_ACTION_LABELS).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || !type || !actionType || createRule.isPending}
          >
            {createRule.isPending ? "Creation..." : "Creer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Campaign Dialog (enhanced with channel + list + content) ──────────

function CreateCampaignDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [channel, setChannel] = useState("");
  const [prospectListId, setProspectListId] = useState("");

  // Step 2 fields
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsMessage, setSmsMessage] = useState("");
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const createCampaign = useCreateCampaign();
  const { data: prospectLists } = useProspectLists();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lists = (prospectLists as any[]) || [];

  const showEmailFields = channel === "EMAIL" || channel === "EMAIL_SMS";
  const showSmsFields = channel === "SMS" || channel === "EMAIL_SMS";

  function resetForm() {
    setStep(1);
    setName("");
    setDescription("");
    setType("");
    setChannel("");
    setProspectListId("");
    setEmailSubject("");
    setEmailBody("");
    setSmsMessage("");
    setShowEmailPreview(false);
  }

  const handleSubmit = () => {
    if (!name || !type || !channel) return;

    createCampaign.mutate(
      {
        name,
        description: description || undefined,
        type,
        channel,
        prospectListId: prospectListId || undefined,
        targetCriteria: {},
        emailSubject: emailSubject || undefined,
        emailBody: emailBody || undefined,
        smsMessage: smsMessage || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Campagne creee avec succes");
          setOpen(false);
          resetForm();
        },
        onError: (error) => toast.error(error.message),
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle campagne
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Nouvelle campagne" : "Contenu de la campagne"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Definissez les parametres de votre campagne."
              : "Redigez le contenu de vos messages."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="campaign-name">Nom de la campagne</Label>
              <Input
                id="campaign-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Reactivation clients mars"
              />
            </div>

            <div>
              <Label htmlFor="campaign-desc">Description (optionnel)</Label>
              <Textarea
                id="campaign-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de la campagne"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAMPAIGN_TYPE_LABELS).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Canal</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAMPAIGN_CHANNEL_LABELS).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Liste de prospects</Label>
              <Select value={prospectListId} onValueChange={setProspectListId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une liste (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune liste</SelectItem>
                  {lists.map(
                    (list: {
                      id: string;
                      name: string;
                      _count: { members: number };
                    }) => (
                      <SelectItem key={list.id} value={list.id}>
                        {list.name} ({list._count.members} prospects)
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Les prospects de la liste seront automatiquement ajoutes comme
                destinataires.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {showEmailFields && (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Contenu Email</span>
                </div>
                <div>
                  <Label htmlFor="email-subject">Objet</Label>
                  <Input
                    id="email-subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Objet de l'email"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Corps du message</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmailPreview(!showEmailPreview)}
                    >
                      {showEmailPreview ? "Editer" : "Apercu"}
                    </Button>
                  </div>
                  {showEmailPreview ? (
                    <EmailTemplatePreview content={emailBody} />
                  ) : (
                    <EmailTemplateEditor
                      value={emailBody}
                      onChange={setEmailBody}
                      placeholder="Bonjour {prenom}, nous souhaitions prendre de vos nouvelles..."
                    />
                  )}
                </div>
              </div>
            )}

            {showSmsFields && (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">Contenu SMS</span>
                </div>
                <div>
                  <Label htmlFor="sms-msg">Message</Label>
                  <Textarea
                    id="sms-msg"
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Bonjour {prenom}, nous souhaitions..."
                    rows={3}
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      Variables : {"{prenom}"}, {"{nom}"}, {"{cabinet}"}
                    </p>
                    <p
                      className={`text-xs ${smsMessage.length > 160 ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {smsMessage.length}/160
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!showEmailFields && !showSmsFields && (
              <div className="text-center py-8 text-muted-foreground">
                Veuillez d&apos;abord selectionner un canal a l&apos;etape
                precedente.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="mr-auto"
            >
              Retour
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              resetForm();
            }}
          >
            Annuler
          </Button>
          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={!name || !type || !channel}
            >
              Suivant
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createCampaign.isPending}
            >
              {createCampaign.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Creer la campagne
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Templates Tab ──────────────────────────────

function TemplatesTab() {
  const { data: templates, isLoading } = useEmailTemplates();
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  const deleteTemplate = useDeleteEmailTemplate();

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<EmailTemplate["category"]>("GENERAL");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategory("GENERAL");
    setSubject("");
    setBody("");
    setIsDefault(false);
    setShowPreview(false);
  };

  const startEditing = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setDescription(template.description || "");
    setCategory(template.category);
    setSubject(template.subject);
    setBody(template.body);
    setIsDefault(template.isDefault);
    setIsCreating(false);
    setShowPreview(false);
  };

  const handleSave = () => {
    if (!name || !subject || !body) return;

    if (editingTemplate) {
      updateTemplate.mutate(
        { id: editingTemplate.id, name, description, category, subject, body, isDefault },
        {
          onSuccess: () => {
            toast.success("Template mis a jour");
            setEditingTemplate(null);
            resetForm();
          },
          onError: (e) => toast.error(e.message),
        }
      );
    } else {
      createTemplate.mutate(
        { name, description, category, subject, body, isDefault },
        {
          onSuccess: () => {
            toast.success("Template cree");
            setIsCreating(false);
            resetForm();
          },
          onError: (e) => toast.error(e.message),
        }
      );
    }
  };

  const handleDelete = (id: string) => {
    deleteTemplate.mutate(id, {
      onSuccess: () => toast.success("Template supprime"),
      onError: (e) => toast.error(e.message),
    });
  };

  const duplicateTemplate = (template: EmailTemplate) => {
    createTemplate.mutate(
      {
        name: `${template.name} (copie)`,
        description: template.description || undefined,
        category: template.category,
        subject: template.subject,
        body: template.body,
      },
      {
        onSuccess: () => toast.success("Template duplique"),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const isEditing = !!editingTemplate || isCreating;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Chargement des templates...
        </CardContent>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{editingTemplate ? "Modifier le template" : "Nouveau template"}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditingTemplate(null);
                setIsCreating(false);
                resetForm();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tpl-name">Nom du template</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Relance J+3"
              />
            </div>
            <div>
              <Label>Categorie</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as EmailTemplate["category"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EMAIL_TEMPLATE_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="tpl-desc">Description (optionnel)</Label>
            <Input
              id="tpl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du template"
            />
          </div>

          <div>
            <Label htmlFor="tpl-subject">Objet de l&apos;email</Label>
            <Input
              id="tpl-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet de l'email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Corps du message</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? "Editer" : "Apercu"}
              </Button>
            </div>
            {showPreview ? (
              <EmailTemplatePreview content={body} />
            ) : (
              <EmailTemplateEditor
                value={body}
                onChange={setBody}
                placeholder="Bonjour {prenom}, nous souhaitions..."
              />
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch checked={isDefault} onCheckedChange={setIsDefault} id="tpl-default" />
            <Label htmlFor="tpl-default">Template par defaut pour cette categorie</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={!name || !subject || !body || createTemplate.isPending || updateTemplate.isPending}
            >
              {(createTemplate.isPending || updateTemplate.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingTemplate ? "Enregistrer" : "Creer le template"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditingTemplate(null);
                setIsCreating(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)}>
          <FileText className="mr-2 h-4 w-4" />
          Nouveau template
        </Button>
      </div>

      {!templates || templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Aucun template</p>
            <p className="text-sm mt-1">
              Creez des templates d&apos;email reutilisables pour vos campagnes.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setIsCreating(true)}>
              Creer un template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              {template.isDefault && (
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Par defaut
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {template.name}
                </CardTitle>
                <CardDescription>
                  <Badge variant="outline" className="text-xs">
                    {EMAIL_TEMPLATE_CATEGORIES[template.category]}
                  </Badge>
                  {template.description && (
                    <span className="ml-2 text-muted-foreground">
                      {template.description}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  <strong>Objet:</strong> {template.subject}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEditing(template)}>
                    Modifier
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => duplicateTemplate(template)}>
                    <Copy className="h-3 w-3 mr-1" />
                    Dupliquer
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce template ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irreversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(template.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

// ── Create List Dialog ──────────────────────────────

function CreateListDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const createList = useCreateProspectList();

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#f97316",
  ];

  function handleSubmit() {
    if (!name) return;
    createList.mutate(
      { name, description: description || undefined, color },
      {
        onSuccess: () => {
          toast.success("Liste creee");
          setOpen(false);
          setName("");
          setDescription("");
          setColor("#3b82f6");
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ListPlus className="mr-2 h-4 w-4" />
          Nouvelle liste
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Creer une liste de prospects</DialogTitle>
          <DialogDescription>
            Regroupez vos prospects pour vos campagnes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="list-name">Nom</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Prospects immigration"
            />
          </div>
          <div>
            <Label htmlFor="list-desc">Description (optionnel)</Label>
            <Textarea
              id="list-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la liste"
              rows={2}
            />
          </div>
          <div>
            <Label>Couleur</Label>
            <div className="flex gap-2 mt-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    color === c
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || createList.isPending}
          >
            {createList.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Creer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Prospect List Detail (Sheet) ──────────────────────────────

function ProspectListDetail({
  listId,
  onClose: _onClose,
}: {
  listId: string;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: list, isLoading } = useProspectList(listId);
  const { data: searchResults } = useSearchProspectsForList(
    listId,
    searchQuery
  );
  const addToList = useAddToProspectList();
  const removeFromList = useRemoveFromProspectList();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listData = list as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results = (searchResults as any[]) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!listData) return null;

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex items-center gap-3">
        <div
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: listData.color || "#3b82f6" }}
        />
        <div>
          <h3 className="font-semibold text-lg">{listData.name}</h3>
          {listData.description && (
            <p className="text-sm text-muted-foreground">
              {listData.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          <Users className="h-3 w-3 mr-1" />
          {listData.members?.length || 0} prospects
        </Badge>
      </div>

      {/* Search to add prospects */}
      <div className="space-y-2">
        <Label>Ajouter des prospects</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email ou telephone..."
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Search results */}
        {searchQuery.length >= 2 && results.length > 0 && (
          <div className="border rounded-lg max-h-48 overflow-y-auto">
            {results.map(
              (prospect: {
                id: string;
                firstName: string | null;
                lastName: string | null;
                email: string | null;
                phone: string | null;
              }) => (
                <div
                  key={prospect.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 border-b last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {prospect.firstName || ""} {prospect.lastName || ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {prospect.email || prospect.phone || ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      addToList.mutate(
                        { listId, prospectIds: [prospect.id] },
                        {
                          onSuccess: () => {
                            toast.success("Prospect ajoute");
                            setSearchQuery("");
                          },
                          onError: (error) => toast.error(error.message),
                        }
                      );
                    }}
                    disabled={addToList.isPending}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )
            )}
          </div>
        )}

        {searchQuery.length >= 2 && results.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Aucun prospect trouve
          </p>
        )}
      </div>

      {/* Current members */}
      <div className="space-y-2">
        <Label>Membres de la liste</Label>
        {listData.members?.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground border rounded-lg">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun prospect dans cette liste</p>
            <p className="text-xs mt-1">
              Utilisez la recherche ci-dessus pour ajouter des prospects
            </p>
          </div>
        ) : (
          <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
            {listData.members?.map(
              (member: {
                id: string;
                prospect: {
                  id: string;
                  firstName: string | null;
                  lastName: string | null;
                  email: string | null;
                  phone: string | null;
                  stage: string;
                  leadScore: number | null;
                };
                addedAt: string;
              }) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {(member.prospect.firstName?.[0] || "").toUpperCase()}
                        {(member.prospect.lastName?.[0] || "").toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {member.prospect.firstName || ""}{" "}
                        {member.prospect.lastName || ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.prospect.email || member.prospect.phone || ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.prospect.leadScore !== null && (
                      <Badge variant="outline" className="text-xs">
                        {member.prospect.leadScore}pts
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        removeFromList.mutate(
                          {
                            listId,
                            prospectId: member.prospect.id,
                          },
                          {
                            onSuccess: () => toast.success("Prospect retire"),
                            onError: (error) => toast.error(error.message),
                          }
                        );
                      }}
                      disabled={removeFromList.isPending}
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────

export default function RelancesPage() {
  const [logPage, setLogPage] = useState(1);
  const [logStatusFilter, setLogStatusFilter] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [deleteListId, setDeleteListId] = useState<string | null>(null);

  const { data: rules, isLoading: rulesLoading } = useAutomationRules();
  const { data: stats } = useAutomationStats();
  const { data: logsData, isLoading: logsLoading } = useAutomationLogs({
    page: logPage,
    limit: 15,
    status: logStatusFilter || undefined,
  });
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const { data: prospectLists, isLoading: listsLoading } = useProspectLists();

  const toggleRule = useToggleAutomationRule();
  const deleteRule = useDeleteAutomationRule();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const deleteList = useDeleteProspectList();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rulesList = (rules as any[]) || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campaignsList = (campaigns as any[]) || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logsList = (logsData as any)?.logs || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pagination = (logsData as any)?.pagination;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listsList = (prospectLists as any[]) || [];

  function handleDeleteList() {
    if (!deleteListId) return;
    deleteList.mutate(deleteListId, {
      onSuccess: () => {
        toast.success("Liste supprimee");
        setDeleteListId(null);
      },
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Automatisations & Relances
          </h1>
          <p className="text-muted-foreground">
            Gerez vos regles de suivi automatique, listes de prospects et
            campagnes
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Regles actives
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeRules ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              sur {stats?.totalRules ?? 0} regles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Executions reussies
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.successLogs ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              sur {stats?.totalLogs ?? 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.pendingLogs ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.failedLogs ?? 0} en echec
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Campagnes actives
            </CardTitle>
            <Megaphone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeCampaigns ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              sur {stats?.totalCampaigns ?? 0} campagnes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Regles</TabsTrigger>
          <TabsTrigger value="logs">Journal</TabsTrigger>
          <TabsTrigger value="lists">Listes</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* ── Rules Tab ──────────────────────────────── */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <CreateRuleDialog />
          </div>

          {rulesLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Chargement des regles...
              </CardContent>
            </Card>
          ) : rulesList.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune regle configuree</p>
                <p className="text-xs mt-1">
                  Creez votre premiere regle d&apos;automatisation
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rulesList.map(
                (rule: {
                  id: string;
                  name: string;
                  description: string | null;
                  type: string;
                  actionType: string;
                  isActive: boolean;
                  _count: { logs: number };
                  createdAt: string;
                }) => (
                  <Card key={rule.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) =>
                            toggleRule.mutate({
                              id: rule.id,
                              isActive: checked,
                            })
                          }
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{rule.name}</p>
                            <Badge variant="outline">
                              {AUTOMATION_TYPE_LABELS[rule.type] || rule.type}
                            </Badge>
                            <Badge variant="secondary">
                              {AUTOMATION_ACTION_LABELS[rule.actionType] ||
                                rule.actionType}
                            </Badge>
                          </div>
                          {rule.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {rule.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {rule._count.logs} executions &middot; Creee le{" "}
                            {new Date(rule.createdAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Supprimer cette regle et son historique ?"
                            )
                          ) {
                            deleteRule.mutate(rule.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Logs Tab ──────────────────────────────── */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select
              value={logStatusFilter}
              onValueChange={(v) => {
                setLogStatusFilter(v === "ALL" ? "" : v);
                setLogPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                {Object.entries(AUTOMATION_LOG_STATUS_LABELS).map(
                  ([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {logsLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Chargement du journal...
              </CardContent>
            </Card>
          ) : logsList.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune execution enregistree</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Regle</TableHead>
                      <TableHead>Prospect</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsList.map(
                      (log: {
                        id: string;
                        createdAt: string;
                        status: string;
                        result: string | null;
                        errorMessage: string | null;
                        rule: {
                          id: string;
                          name: string;
                          type: string;
                        } | null;
                        prospect: {
                          id: string;
                          firstName: string | null;
                          lastName: string | null;
                        } | null;
                      }) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {new Date(log.createdAt).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">
                                {log.rule?.name || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {log.rule
                                  ? AUTOMATION_TYPE_LABELS[log.rule.type] ||
                                    log.rule.type
                                  : ""}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.prospect
                              ? `${log.prospect.firstName || ""} ${log.prospect.lastName || ""}`.trim() ||
                                "Sans nom"
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                AUTOMATION_LOG_STATUS_COLORS[log.status] || ""
                              }
                            >
                              {AUTOMATION_LOG_STATUS_LABELS[log.status] ||
                                log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {log.errorMessage || log.result || "—"}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </Card>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} sur {pagination.totalPages} (
                    {pagination.total} resultats)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={logPage <= 1}
                      onClick={() => setLogPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={logPage >= pagination.totalPages}
                      onClick={() => setLogPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Lists Tab ──────────────────────────────── */}
        <TabsContent value="lists" className="space-y-4">
          <div className="flex justify-end">
            <CreateListDialog />
          </div>

          {listsLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Chargement des listes...
              </CardContent>
            </Card>
          ) : listsList.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune liste creee</p>
                <p className="text-xs mt-1">
                  Creez des listes pour regrouper vos prospects et les cibler
                  dans vos campagnes
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {listsList.map(
                (list: {
                  id: string;
                  name: string;
                  description: string | null;
                  color: string | null;
                  _count: { members: number; campaigns: number };
                  createdAt: string;
                }) => (
                  <Card key={list.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: list.color || "#3b82f6",
                            }}
                          />
                          <CardTitle className="text-base">
                            {list.name}
                          </CardTitle>
                        </div>
                      </div>
                      {list.description && (
                        <CardDescription>{list.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">
                            <Users className="h-3 w-3 mr-1" />
                            {list._count.members} prospects
                          </Badge>
                          {list._count.campaigns > 0 && (
                            <Badge variant="outline">
                              <Megaphone className="h-3 w-3 mr-1" />
                              {list._count.campaigns} campagnes
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            {new Date(list.createdAt).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedListId(list.id)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Gerer
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteListId(list.id)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Campaigns Tab ──────────────────────────────── */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <CreateCampaignDialog />
          </div>

          {campaignsLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Chargement des campagnes...
              </CardContent>
            </Card>
          ) : campaignsList.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune campagne creee</p>
                <p className="text-xs mt-1">
                  Creez votre premiere campagne de reactivation
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {campaignsList.map(
                (campaign: {
                  id: string;
                  name: string;
                  description: string | null;
                  type: string;
                  status: string;
                  channel: string | null;
                  totalTargeted: number;
                  totalSent: number;
                  totalOpened: number;
                  totalClicked: number;
                  totalConverted: number;
                  prospectList: {
                    id: string;
                    name: string;
                    _count: { members: number };
                  } | null;
                  _count: { recipients: number };
                  createdAt: string;
                }) => (
                  <Card key={campaign.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {campaign.name}
                        </CardTitle>
                        <Badge
                          className={
                            CAMPAIGN_STATUS_COLORS[campaign.status] || ""
                          }
                        >
                          {CAMPAIGN_STATUS_LABELS[campaign.status] ||
                            campaign.status}
                        </Badge>
                      </div>
                      {campaign.description && (
                        <CardDescription>
                          {campaign.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Channel + List info */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">
                            {CAMPAIGN_TYPE_LABELS[campaign.type] ||
                              campaign.type}
                          </Badge>
                          {campaign.channel && (
                            <Badge variant="secondary">
                              {campaign.channel === "EMAIL" && (
                                <Mail className="h-3 w-3 mr-1" />
                              )}
                              {campaign.channel === "SMS" && (
                                <MessageSquare className="h-3 w-3 mr-1" />
                              )}
                              {campaign.channel === "EMAIL_SMS" && (
                                <Mail className="h-3 w-3 mr-1" />
                              )}
                              {CAMPAIGN_CHANNEL_LABELS[campaign.channel] ||
                                campaign.channel}
                            </Badge>
                          )}
                          {campaign.prospectList && (
                            <Badge
                              variant="outline"
                              className="cursor-pointer"
                              onClick={() =>
                                setSelectedListId(campaign.prospectList!.id)
                              }
                            >
                              <Users className="h-3 w-3 mr-1" />
                              {campaign.prospectList.name}
                            </Badge>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold">
                              {campaign.totalTargeted || campaign._count.recipients}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Cibles
                            </p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">
                              {campaign.totalSent}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Envoyes
                            </p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">
                              {campaign.totalOpened}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Ouverts
                            </p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">
                              {campaign.totalConverted}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Convertis
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              campaign.createdAt
                            ).toLocaleDateString("fr-FR")}
                          </span>
                          <div className="flex gap-1">
                            {campaign.status === "DRAFT" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateCampaign.mutate({
                                    id: campaign.id,
                                    data: { status: "ACTIVE" },
                                  })
                                }
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Lancer
                              </Button>
                            )}
                            {campaign.status === "ACTIVE" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateCampaign.mutate({
                                    id: campaign.id,
                                    data: { status: "PAUSED" },
                                  })
                                }
                              >
                                <Pause className="h-3 w-3 mr-1" />
                                Pause
                              </Button>
                            )}
                            {campaign.status === "PAUSED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateCampaign.mutate({
                                    id: campaign.id,
                                    data: { status: "ACTIVE" },
                                  })
                                }
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Reprendre
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Supprimer cette campagne ?"
                                  )
                                ) {
                                  deleteCampaign.mutate(campaign.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Templates Tab ──────────────────────────────── */}
        <TabsContent value="templates" className="space-y-4">
          <TemplatesTab />
        </TabsContent>
      </Tabs>

      {/* ── List Detail Sheet ──────────────────────────────── */}
      <Sheet
        open={!!selectedListId}
        onOpenChange={(v) => !v && setSelectedListId(null)}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Gestion de la liste</SheetTitle>
            <SheetDescription>
              Ajoutez ou retirez des prospects de cette liste.
            </SheetDescription>
          </SheetHeader>
          {selectedListId && (
            <ProspectListDetail
              listId={selectedListId}
              onClose={() => setSelectedListId(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* ── Delete List Confirmation ──────────────────────────────── */}
      <AlertDialog
        open={!!deleteListId}
        onOpenChange={(v) => !v && setDeleteListId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette liste ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible. Les prospects ne seront pas
              supprimes, mais ils seront retires de cette liste.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteList}
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
