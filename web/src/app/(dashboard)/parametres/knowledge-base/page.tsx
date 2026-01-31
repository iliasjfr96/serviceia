"use client";

import { useState } from "react";
import {
  useKnowledgeDocuments,
  useKnowledgeStats,
  useCreateKnowledgeDocument,
  useUpdateKnowledgeDocument,
  useDeleteKnowledgeDocument,
} from "@/hooks/use-knowledge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  BookOpen,
  Plus,
  Trash2,
  Pencil,
  Search,
  FileText,
  Database,
  Puzzle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  sourceType: string;
  isActive: boolean;
  language: string;
  createdAt: string;
  updatedAt: string;
  _count: { chunks: number };
}

const SOURCE_TYPES = [
  { value: "faq", label: "FAQ" },
  { value: "procedure", label: "Procedure" },
  { value: "tarif", label: "Tarifs" },
  { value: "legal", label: "Information juridique" },
  { value: "cabinet", label: "Presentation cabinet" },
  { value: "other", label: "Autre" },
];

export default function KnowledgeBasePage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useKnowledgeDocuments({ search, page });
  const { data: stats } = useKnowledgeStats();
  const createMutation = useCreateKnowledgeDocument();
  const updateMutation = useUpdateKnowledgeDocument();
  const deleteMutation = useDeleteKnowledgeDocument();

  const [createOpen, setCreateOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<KnowledgeDocument | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    content: "",
    sourceType: "faq",
  });

  function resetForm() {
    setForm({ title: "", content: "", sourceType: "faq" });
  }

  function handleCreate() {
    createMutation.mutate(form, {
      onSuccess: () => {
        toast.success("Document ajoute a la base de connaissances");
        setCreateOpen(false);
        resetForm();
      },
      onError: () => toast.error("Erreur creation document"),
    });
  }

  function handleUpdate() {
    if (!editDoc) return;
    updateMutation.mutate(
      { id: editDoc.id, ...form },
      {
        onSuccess: () => {
          toast.success("Document mis a jour");
          setEditDoc(null);
          resetForm();
        },
        onError: () => toast.error("Erreur mise a jour"),
      }
    );
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success("Document supprime");
        setDeleteId(null);
      },
      onError: () => toast.error("Erreur suppression"),
    });
  }

  function handleToggleActive(doc: KnowledgeDocument) {
    updateMutation.mutate(
      { id: doc.id, isActive: !doc.isActive },
      {
        onSuccess: () =>
          toast.success(doc.isActive ? "Document desactive" : "Document active"),
      }
    );
  }

  const documents: KnowledgeDocument[] = data?.documents || [];
  const pagination = data?.pagination;

  const docFormContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Titre</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="FAQ - Horaires et tarifs"
          />
        </div>
        <div className="space-y-2">
          <Label>Type de source</Label>
          <Select
            value={form.sourceType}
            onValueChange={(v) => setForm((f) => ({ ...f, sourceType: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Contenu</Label>
        <Textarea
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder="Saisissez le contenu du document ici. Separeze les sections par des lignes vides pour un meilleur decoupage..."
          rows={12}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Le contenu sera automatiquement decoupe en chunks pour la recherche
          RAG. Separze les sections par des lignes vides.
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/parametres">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Base de connaissances
            </h1>
            <p className="text-muted-foreground">
              Documents utilises par l&apos;agent IA pour repondre aux questions
            </p>
          </div>
        </div>
        <Dialog
          open={createOpen}
          onOpenChange={(v) => {
            setCreateOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Ajouter un document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nouveau document</DialogTitle>
              <DialogDescription>
                Ajoutez un document a la base de connaissances de l&apos;agent IA
              </DialogDescription>
            </DialogHeader>
            {docFormContent}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  !form.title || !form.content || createMutation.isPending
                }
              >
                {createMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalDocs}</p>
                  <p className="text-xs text-muted-foreground">
                    Documents totaux
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeDocs}</p>
                  <p className="text-xs text-muted-foreground">Actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Puzzle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalChunks}</p>
                  <p className="text-xs text-muted-foreground">
                    Chunks indexes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Rechercher un document..."
          className="pl-9"
        />
      </div>

      {/* Documents list */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucun document dans la base de connaissances
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter votre premier document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{doc.title}</CardTitle>
                    <Badge variant={doc.isActive ? "default" : "secondary"}>
                      {doc.isActive ? "Actif" : "Inactif"}
                    </Badge>
                    <Badge variant="outline">
                      {SOURCE_TYPES.find((t) => t.value === doc.sourceType)
                        ?.label || doc.sourceType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {doc._count.chunks} chunks
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={doc.isActive}
                      onCheckedChange={() => handleToggleActive(doc)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setForm({
                          title: doc.title,
                          content: doc.content,
                          sourceType: doc.sourceType,
                        });
                        setEditDoc(doc);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="line-clamp-2 mt-1">
                  {doc.content.substring(0, 200)}...
                </CardDescription>
              </CardHeader>
            </Card>
          ))}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Precedent
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-3">
                Page {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page >= pagination.totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editDoc}
        onOpenChange={(v) => {
          if (!v) {
            setEditDoc(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le document</DialogTitle>
            <DialogDescription>
              Le contenu sera re-decoupe en chunks apres la sauvegarde
            </DialogDescription>
          </DialogHeader>
          {docFormContent}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDoc(null);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                !form.title || !form.content || updateMutation.isPending
              }
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le document et tous ses chunks seront definitivement supprimes.
              L&apos;agent IA ne pourra plus utiliser ces informations.
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
