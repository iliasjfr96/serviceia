"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProspects, useDeleteProspect, useBulkAction } from "@/hooks/use-prospects";
import { useProspectLists, useAddToProspectList } from "@/hooks/use-prospect-lists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  STAGE_LABELS,
  URGENCY_LABELS,
} from "@/lib/constants/pipeline";
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Phone,
  Mail,
  X,
  PhoneCall,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Prospect {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  stage: string;
  urgencyLevel: string;
  source: string;
  leadScore: number;
  practiceArea?: { name: string; color: string } | null;
  calls?: { id: string; createdAt: string; isEmergency: boolean; summary?: string }[];
}

function isRecentCall(dateStr: string): boolean {
  const callDate = new Date(dateStr);
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  return callDate > oneDayAgo;
}

function formatCallDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `il y a ${diffMins}min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

const STAGE_STYLES: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  CONTACTED: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  QUALIFIED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  PROPOSAL: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  NEGOTIATION: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  CLIENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  LOST: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
};

const URGENCY_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export function ProspectTable() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<string>("");
  const [urgencyLevel, setUrgencyLevel] = useState<string>("");
  const [hasRecentCalls, setHasRecentCalls] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const limit = 25;

  const { data, isLoading } = useProspects({
    search: search || undefined,
    stage: stage || undefined,
    urgencyLevel: urgencyLevel || undefined,
    hasRecentCalls: hasRecentCalls || undefined,
    page,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const deleteMutation = useDeleteProspect();
  const bulkMutation = useBulkAction();
  const { data: prospectLists } = useProspectLists();
  const addToListMutation = useAddToProspectList();

  const prospects: Prospect[] = data?.prospects ?? [];
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0 };

  function handleDelete(id: string, name: string) {
    if (!confirm(`Supprimer le prospect "${name}" ?`)) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Prospect supprime"),
      onError: () => toast.error("Erreur lors de la suppression"),
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === prospects.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(prospects.map((p) => p.id)));
    }
  }

  function handleBulkStage(newStage: string) {
    const ids = Array.from(selected);
    bulkMutation.mutate(
      { action: "updateStage", prospectIds: ids, stage: newStage },
      {
        onSuccess: (data) => {
          toast.success(`${data.updated} prospect(s) mis a jour`);
          setSelected(new Set());
        },
        onError: () => toast.error("Erreur lors de la mise a jour"),
      }
    );
  }

  function handleAddToList(listId: string) {
    const ids = Array.from(selected);
    addToListMutation.mutate(
      { listId, prospectIds: ids },
      {
        onSuccess: (data) => {
          toast.success(`${data.added} prospect(s) ajoute(s) a la liste`);
          setSelected(new Set());
        },
        onError: () => toast.error("Erreur lors de l'ajout a la liste"),
      }
    );
  }

  function handleBulkDelete() {
    const ids = Array.from(selected);
    if (!confirm(`Supprimer ${ids.length} prospect(s) ?`)) return;
    bulkMutation.mutate(
      { action: "delete", prospectIds: ids },
      {
        onSuccess: (data) => {
          toast.success(`${data.deleted} prospect(s) supprime(s)`);
          setSelected(new Set());
        },
        onError: () => toast.error("Erreur lors de la suppression"),
      }
    );
  }

  const hasFilters = search || stage || urgencyLevel || hasRecentCalls;

  return (
    <div>
      {/* Filters */}
      <div className="p-4 border-b flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8 h-9"
          />
        </div>
        <Select
          value={stage}
          onValueChange={(v) => {
            setStage(v === "ALL" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous</SelectItem>
            {Object.entries(STAGE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={urgencyLevel}
          onValueChange={(v) => {
            setUrgencyLevel(v === "ALL" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Urgence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes</SelectItem>
            {Object.entries(URGENCY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={hasRecentCalls ? "default" : "outline"}
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => {
            setHasRecentCalls(!hasRecentCalls);
            setPage(1);
          }}
        >
          <PhoneCall className="h-3.5 w-3.5" />
          Appels recents
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => {
              setSearch("");
              setStage("");
              setUrgencyLevel("");
              setHasRecentCalls(false);
              setPage(1);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="px-4 py-2 border-b bg-muted/50 flex items-center gap-2 text-sm">
          <span className="font-medium">{selected.size} selectionne(s)</span>
          <Select onValueChange={handleBulkStage}>
            <SelectTrigger className="w-[150px] h-8">
              <SelectValue placeholder="Changer statut" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STAGE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {prospectLists && prospectLists.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  Ajouter a liste
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {prospectLists.map((list: { id: string; name: string; color: string | null }) => (
                  <DropdownMenuItem key={list.id} onClick={() => handleAddToList(list.id)}>
                    <div
                      className="h-2 w-2 rounded-full mr-2"
                      style={{ backgroundColor: list.color || "#3b82f6" }}
                    />
                    {list.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="destructive"
            size="sm"
            className="h-8"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Supprimer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 ml-auto"
            onClick={() => setSelected(new Set())}
          >
            Annuler
          </Button>
        </div>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={prospects.length > 0 && selected.size === prospects.length}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Nom</TableHead>
            <TableHead className="hidden sm:table-cell">Contact</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="hidden md:table-cell">Urgence</TableHead>
            <TableHead className="hidden lg:table-cell">Dernier appel</TableHead>
            <TableHead className="hidden xl:table-cell">Score</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              </TableCell>
            </TableRow>
          ) : prospects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Aucun prospect
              </TableCell>
            </TableRow>
          ) : (
            prospects.map((p) => {
              const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ") || "Sans nom";
              const lastCall = p.calls?.[0];
              const hasNewCall = lastCall && isRecentCall(lastCall.createdAt);
              return (
                <TableRow
                  key={p.id}
                  className={cn("cursor-pointer", hasNewCall && "bg-blue-50/50 dark:bg-blue-950/20")}
                  onClick={() => router.push(`/prospects/${p.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggleSelect(p.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium">{fullName}</p>
                        {p.practiceArea && (
                          <p className="text-xs text-muted-foreground">{p.practiceArea.name}</p>
                        )}
                      </div>
                      {hasNewCall && (
                        <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0">
                          <PhoneCall className="h-2.5 w-2.5 mr-0.5" />
                          Nouvel appel
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      {p.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {p.phone}
                        </div>
                      )}
                      {p.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {p.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn("font-normal", STAGE_STYLES[p.stage])}>
                      {STAGE_LABELS[p.stage] || p.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary" className={cn("font-normal", URGENCY_STYLES[p.urgencyLevel])}>
                      {URGENCY_LABELS[p.urgencyLevel] || p.urgencyLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {lastCall ? (
                      <div className="text-xs">
                        <p className={cn("font-medium", hasNewCall && "text-blue-600 dark:text-blue-400")}>
                          {formatCallDate(lastCall.createdAt)}
                        </p>
                        {lastCall.isEmergency && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0 mt-0.5">
                            Urgent
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${p.leadScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{p.leadScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/prospects/${p.id}`);
                        }}>
                          <Eye className="mr-2 h-4 w-4" /> Voir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(p.id, fullName);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {pagination.total} prospect(s)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
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
    </div>
  );
}
