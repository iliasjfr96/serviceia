"use client";

import dynamic from "next/dynamic";
import {
  useDashboardKPIs,
  useDashboardCharts,
  useRecentActivity,
} from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Users,
  Calendar,
  AlertTriangle,
  PhoneIncoming,
  PhoneOutgoing,
  UserPlus,
  CalendarCheck,
  Loader2,
  ArrowRight,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Lazy load heavy chart components (Recharts ~200KB)
const ActivityChart = dynamic(
  () => import("@/components/dashboard/dashboard-charts").then((mod) => mod.ActivityChart),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[240px]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

const PipelineChart = dynamic(
  () => import("@/components/dashboard/dashboard-charts").then((mod) => mod.PipelineChart),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[240px]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Hier";
  return `Il y a ${diffD}j`;
}

// KPI Card with professional styling
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  trend,
  className,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  href?: string;
  trend?: { value: number; label: string };
  className?: string;
}) {
  const content = (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/5",
      href && "cursor-pointer hover:border-primary/30",
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className={cn(
                  "h-3 w-3",
                  trend.value >= 0 ? "text-emerald-500" : "text-rose-500"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  trend.value >= 0 ? "text-emerald-600" : "text-rose-600"
                )}>
                  {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
                </span>
              </div>
            )}
          </div>
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}

export default function DashboardPage() {
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vue d&apos;ensemble de votre activite
        </p>
      </div>

      {/* Emergency Alert */}
      {(kpis?.emergencies ?? 0) > 0 && (
        <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/50">
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <p className="font-medium text-rose-900 dark:text-rose-100">
                    {kpis?.emergencies} urgence(s) detectee(s)
                  </p>
                  <p className="text-sm text-rose-600/80 dark:text-rose-300/70">
                    Necessite une attention immediate
                  </p>
                </div>
              </div>
              <Button variant="destructive" size="sm" asChild>
                <Link href="/calls?filter=emergency">
                  Traiter
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpisLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <KPICard
              title="Appels aujourd'hui"
              value={kpis?.callsToday ?? 0}
              subtitle={`${kpis?.callsThisWeek ?? 0} cette semaine`}
              icon={Phone}
              href="/calls"
            />
            <KPICard
              title="Prospects"
              value={kpis?.totalProspects ?? 0}
              subtitle={`+${kpis?.prospectsThisWeek ?? 0} cette semaine`}
              icon={Users}
              href="/prospects"
            />
            <KPICard
              title="Rendez-vous"
              value={kpis?.appointmentsThisWeek ?? 0}
              subtitle={`${kpis?.appointmentsToday ?? 0} aujourd'hui`}
              icon={Calendar}
              href="/agenda"
            />
            <KPICard
              title="Conversion"
              value={`${kpis?.conversionRate ?? 0}%`}
              subtitle={`${kpis?.convertedThisMonth ?? 0} ce mois`}
              icon={Target}
            />
          </>
        )}
      </div>

      {/* Charts - Lazy loaded */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Activity Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Activite sur 7 jours</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <div className="flex items-center justify-center h-[240px]">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ActivityChart data={charts?.dailyActivity ?? []} />
            )}
          </CardContent>
        </Card>

        {/* Pipeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Pipeline commercial</CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <div className="flex items-center justify-center h-[240px]">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <PipelineChart data={charts?.pipeline ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity & Appointments */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Activite recente</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !activity || activity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Aucune activite recente</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activity.slice(0, 6).map(
                  (item: {
                    type: string;
                    id: string;
                    createdAt: string;
                    data: Record<string, unknown>;
                  }) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors duration-200"
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        item.type === "call"
                          ? "bg-primary/10"
                          : item.type === "prospect"
                          ? "bg-emerald-500/10"
                          : "bg-violet-500/10"
                      )}>
                        {item.type === "call" ? (
                          item.data.direction === "INBOUND" ? (
                            <PhoneIncoming className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <PhoneOutgoing className="h-3.5 w-3.5 text-primary" />
                          )
                        ) : item.type === "prospect" ? (
                          <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <CalendarCheck className="h-3.5 w-3.5 text-violet-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.type === "call" && (
                            <>
                              Appel {(item.data.direction as string) === "INBOUND" ? "entrant" : "sortant"}
                              {item.data.prospect && (
                                <span className="text-muted-foreground font-normal">
                                  {" "}- {[(item.data.prospect as Record<string, string>).firstName, (item.data.prospect as Record<string, string>).lastName].filter(Boolean).join(" ")}
                                </span>
                              )}
                            </>
                          )}
                          {item.type === "prospect" && (
                            <>
                              Nouveau prospect
                              <span className="text-muted-foreground font-normal">
                                {" "}- {[item.data.firstName as string, item.data.lastName as string].filter(Boolean).join(" ") || "Sans nom"}
                              </span>
                            </>
                          )}
                          {item.type === "appointment" && (
                            <>
                              Rendez-vous
                              <span className="text-muted-foreground font-normal">
                                {" "}- {item.data.title as string}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Prochains rendez-vous</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
              <Link href="/agenda">
                Voir l&apos;agenda
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pb-4">
            {!kpis?.upcomingAppointments || kpis.upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <div className="p-3 rounded-full bg-muted/50 w-fit mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">Aucun rendez-vous planifie</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/agenda">Planifier un RDV</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {kpis.upcomingAppointments.slice(0, 5).map(
                  (appt: {
                    id: string;
                    title: string;
                    startTime: string;
                    prospect?: { firstName?: string; lastName?: string } | null;
                  }) => (
                    <Link
                      key={appt.id}
                      href="/agenda"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors duration-200"
                    >
                      <div className="p-1.5 rounded-lg bg-violet-500/10">
                        <Calendar className="h-3.5 w-3.5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{appt.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(appt.startTime).toLocaleDateString("fr-FR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {appt.prospect && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {[appt.prospect.firstName, appt.prospect.lastName].filter(Boolean).join(" ")}
                        </span>
                      )}
                    </Link>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
