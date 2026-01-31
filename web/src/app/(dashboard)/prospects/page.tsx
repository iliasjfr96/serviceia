"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProspectTable } from "@/components/prospects/prospect-table";
import { PipelineStats } from "@/components/prospects/pipeline-stats";
import { Plus, LayoutList, Columns3, ListChecks, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Lazy load heavy components (dnd-kit ~50KB)
const KanbanBoard = dynamic(
  () => import("@/components/prospects/kanban-board").then((mod) => mod.KanbanBoard),
  {
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

const ProspectLists = dynamic(
  () => import("@/components/prospects/prospect-lists").then((mod) => mod.ProspectLists),
  {
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export default function ProspectsPage() {
  const [view, setView] = useState<"table" | "kanban" | "lists">("table");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/v1/prospects/export");
      if (!res.ok) throw new Error("Erreur export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prospects_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export CSV telecharge");
    } catch {
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Prospects</h1>
          <p className="text-sm text-muted-foreground">
            Gerez vos prospects et suivez votre pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline ml-2">Export</span>
          </Button>
          <Button asChild size="sm">
            <Link href="/prospects/new">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Nouveau</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setView("table")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
            view === "table"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutList className="h-4 w-4" />
          Table
        </button>
        <button
          onClick={() => setView("kanban")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
            view === "kanban"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Columns3 className="h-4 w-4" />
          Kanban
        </button>
        <button
          onClick={() => setView("lists")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
            view === "lists"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <ListChecks className="h-4 w-4" />
          Listes
        </button>
      </div>

      {/* Content */}
      <div className="rounded-lg border bg-card">
        {view !== "lists" && <PipelineStats />}
        {view === "table" ? (
          <ProspectTable />
        ) : view === "kanban" ? (
          <KanbanBoard />
        ) : (
          <ProspectLists />
        )}
      </div>
    </div>
  );
}
