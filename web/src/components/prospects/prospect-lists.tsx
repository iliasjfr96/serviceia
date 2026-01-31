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
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/alert-dialog";
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
  Plus,
  Trash2,
  Users,
  Search,
  X,
  Loader2,
  ListPlus,
  Pencil,
  Megaphone,
  UserPlus,
  UserMinus,
} from "lucide-react";
import {
  useProspectLists,
  useProspectList,
  useCreateProspectList,
  useUpdateProspectList,
  useDeleteProspectList,
  useAddToProspectList,
  useRemoveFromProspectList,
  useSearchProspectsForList,
} from "@/hooks/use-prospect-lists";
import { STAGE_LABELS, STAGE_COLORS } from "@/lib/constants/pipeline";

interface ProspectList {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { members: number; campaigns: number };
}

interface ProspectMember {
  id: string;
  prospect: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    stage: string;
    leadScore: number;
  };
  addedAt: string;
}

interface SearchResult {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
}

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

export function ProspectLists() {
  const { data: lists, isLoading } = useProspectLists();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [deleteListId, setDeleteListId] = useState<string | null>(null);
  const [editList, setEditList] = useState<ProspectList | null>(null);
  const deleteMutation = useDeleteProspectList();

  const prospectLists: ProspectList[] = lists || [];

  function handleDeleteConfirm() {
    if (!deleteListId) return;
    deleteMutation.mutate(deleteListId, {
      onSuccess: () => {
        toast.success("Liste supprimee");
        setDeleteListId(null);
        if (selectedListId === deleteListId) setSelectedListId(null);
      },
      onError: () => toast.error("Erreur lors de la suppression"),
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {prospectLists.length} liste{prospectLists.length !== 1 ? "s" : ""}{" "}
            de prospects
          </p>
        </div>
        <CreateListDialog />
      </div>

      {prospectLists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ListPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">Aucune liste</p>
            <p className="text-sm text-muted-foreground mb-4">
              Creez des listes pour organiser vos prospects et cibler vos
              campagnes.
            </p>
            <CreateListDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prospectLists.map((list) => (
            <Card
              key={list.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedListId(list.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: list.color || "#3b82f6" }}
                    />
                    <CardTitle className="text-base">{list.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditList(list);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteListId(list.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {list.description && (
                  <CardDescription className="text-xs line-clamp-2">
                    {list.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {list._count.members} prospect
                    {list._count.members !== 1 ? "s" : ""}
                  </span>
                  {list._count.campaigns > 0 && (
                    <span className="flex items-center gap-1">
                      <Megaphone className="h-3 w-3" />
                      {list._count.campaigns} campagne
                      {list._count.campaigns !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Mise a jour:{" "}
                  {new Date(list.updatedAt).toLocaleDateString("fr")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List Detail Sheet */}
      {selectedListId && (
        <ListDetailSheet
          listId={selectedListId}
          onClose={() => setSelectedListId(null)}
        />
      )}

      {/* Edit List Dialog */}
      {editList && (
        <EditListDialog list={editList} onClose={() => setEditList(null)} />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteListId}
        onOpenChange={(v) => !v && setDeleteListId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette liste ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les prospects ne seront pas supprimes, mais ils seront retires de
              la liste. Les campagnes associees perdront leur lien avec cette
              liste.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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

// ── Create List Dialog ──────────────────────────────

function CreateListDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const createList = useCreateProspectList();

  function handleSubmit() {
    if (!name.trim()) return;
    createList.mutate(
      { name: name.trim(), description: description || undefined, color },
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
            Regroupez vos prospects pour vos campagnes et suivis.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="create-name">Nom</Label>
            <Input
              id="create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Prospects immigration 2025"
            />
          </div>
          <div>
            <Label htmlFor="create-desc">Description (optionnel)</Label>
            <Textarea
              id="create-desc"
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
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || createList.isPending}
          >
            {createList.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Creer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit List Dialog ──────────────────────────────

function EditListDialog({
  list,
  onClose,
}: {
  list: ProspectList;
  onClose: () => void;
}) {
  const [name, setName] = useState(list.name);
  const [description, setDescription] = useState(list.description || "");
  const [color, setColor] = useState(list.color || "#3b82f6");
  const updateList = useUpdateProspectList();

  function handleSubmit() {
    if (!name.trim()) return;
    updateList.mutate(
      {
        id: list.id,
        name: name.trim(),
        description: description || undefined,
        color,
      },
      {
        onSuccess: () => {
          toast.success("Liste mise a jour");
          onClose();
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la liste</DialogTitle>
          <DialogDescription>
            Modifiez les informations de la liste.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Nom</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-desc">Description (optionnel)</Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || updateList.isPending}
          >
            {updateList.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── List Detail Sheet ──────────────────────────────

function ListDetailSheet({
  listId,
  onClose,
}: {
  listId: string;
  onClose: () => void;
}) {
  const { data: list, isLoading } = useProspectList(listId);
  const removeMutation = useRemoveFromProspectList();
  const [searchMode, setSearchMode] = useState(false);

  const members: ProspectMember[] = list?.members || [];

  function handleRemove(prospectId: string, name: string) {
    removeMutation.mutate(
      { listId, prospectId },
      {
        onSuccess: () => toast.success(`${name} retire de la liste`),
        onError: () => toast.error("Erreur lors du retrait"),
      }
    );
  }

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : list ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: list.color || "#3b82f6" }}
                />
                <SheetTitle>{list.name}</SheetTitle>
              </div>
              {list.description && (
                <SheetDescription>{list.description}</SheetDescription>
              )}
            </SheetHeader>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {members.length} prospect{members.length !== 1 ? "s" : ""}
                </p>
                <Button
                  size="sm"
                  variant={searchMode ? "secondary" : "outline"}
                  onClick={() => setSearchMode(!searchMode)}
                >
                  <UserPlus className="mr-2 h-3 w-3" />
                  Ajouter
                </Button>
              </div>

              {searchMode && (
                <AddProspectsSearch
                  listId={listId}
                  onDone={() => setSearchMode(false)}
                />
              )}

              {members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucun prospect dans cette liste</p>
                  <p className="text-xs mt-1">
                    Utilisez le bouton &ldquo;Ajouter&rdquo; pour rechercher et
                    ajouter des prospects.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const p = member.prospect;
                      const fullName =
                        [p.firstName, p.lastName].filter(Boolean).join(" ") ||
                        "Sans nom";
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <p className="text-sm font-medium">{fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              Score: {p.leadScore}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-0.5">
                              {p.email && <p>{p.email}</p>}
                              {p.phone && <p>{p.phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={STAGE_COLORS[p.stage] || ""}
                            >
                              {STAGE_LABELS[p.stage] || p.stage}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleRemove(p.id, fullName)}
                              disabled={removeMutation.isPending}
                            >
                              <UserMinus className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Liste introuvable
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Search & Add Prospects ──────────────────────────────

function AddProspectsSearch({
  listId,
  onDone,
}: {
  listId: string;
  onDone: () => void;
}) {
  const [search, setSearch] = useState("");
  const { data: results, isLoading } = useSearchProspectsForList(listId, search);
  const addMutation = useAddToProspectList();

  const searchResults: SearchResult[] = results || [];

  function handleAdd(prospectId: string) {
    addMutation.mutate(
      { listId, prospectIds: [prospectId] },
      {
        onSuccess: () => toast.success("Prospect ajoute a la liste"),
        onError: () => toast.error("Erreur lors de l'ajout"),
      }
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un prospect..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
              autoFocus
            />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDone}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {search.length >= 2 && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {isLoading ? (
              <div className="flex justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                Aucun prospect trouve
              </p>
            ) : (
              searchResults.map((p) => {
                const name =
                  [p.firstName, p.lastName].filter(Boolean).join(" ") ||
                  "Sans nom";
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted"
                  >
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.email || p.phone}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      onClick={() => handleAdd(p.id)}
                      disabled={addMutation.isPending}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {search.length > 0 && search.length < 2 && (
          <p className="text-xs text-muted-foreground text-center">
            Tapez au moins 2 caracteres
          </p>
        )}
      </CardContent>
    </Card>
  );
}
