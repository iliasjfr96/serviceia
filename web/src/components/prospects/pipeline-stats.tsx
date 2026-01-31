"use client";

import { useProspectStats } from "@/hooks/use-prospects";
import { STAGE_LABELS, STAGES_ORDER } from "@/lib/constants/pipeline";
import { Users, TrendingUp, AlertTriangle, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-slate-400",
  CONTACTED: "bg-blue-500",
  QUALIFIED: "bg-indigo-500",
  PROPOSAL: "bg-violet-500",
  NEGOTIATION: "bg-purple-500",
  CLIENT: "bg-emerald-500",
  LOST: "bg-rose-500",
};

export function PipelineStats() {
  const { data: stats, isLoading } = useProspectStats();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  const criticalCount = stats.byUrgency?.CRITICAL ?? 0;
  const highCount = stats.byUrgency?.HIGH ?? 0;

  return (
    <div className="p-4 space-y-4 border-b">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Prospects</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold">{stats.avgScore}</p>
            <p className="text-xs text-muted-foreground">Score moyen</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold">{stats.byStage?.CLIENT ?? 0}</p>
            <p className="text-xs text-muted-foreground">Clients</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            criticalCount + highCount > 0 ? "bg-red-100 dark:bg-red-950" : "bg-muted"
          )}>
            <AlertTriangle className={cn(
              "h-4 w-4",
              criticalCount + highCount > 0 ? "text-red-500" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className="text-2xl font-semibold">{criticalCount + highCount}</p>
            <p className="text-xs text-muted-foreground">Urgents</p>
          </div>
        </div>
      </div>

      {/* Pipeline bar */}
      {stats.total > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden bg-muted">
          {STAGES_ORDER.map((stage) => {
            const count = stats.byStage?.[stage] ?? 0;
            const percentage = (count / stats.total) * 100;
            if (count === 0) return null;

            return (
              <div
                key={stage}
                className={cn(STAGE_COLORS[stage])}
                style={{ width: `${percentage}%` }}
                title={`${STAGE_LABELS[stage]}: ${count}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
