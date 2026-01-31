"use client";

import { useState, useMemo } from "react";
import {
  useAppointments,
  useAppointmentStats,
  useUpdateAppointmentStatus,
  useDeleteAppointment,
} from "@/hooks/use-appointments";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_COLORS,
  BOOKED_BY_LABELS,
  CONSULTATION_TYPES,
} from "@/lib/constants/appointments";
import { AppointmentDialog } from "@/components/agenda/appointment-dialog";
import { AvailabilityManager } from "@/components/agenda/availability-manager";
import { toast } from "sonner";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CalendarCheck,
  AlertTriangle,
  Loader2,
  Trash2,
  Settings2,
} from "lucide-react";

interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number;
  consultationType?: string;
  location?: string;
  isVirtual: boolean;
  meetingUrl?: string;
  status: string;
  bookedBy: string;
  prospectId?: string;
  prospect?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  } | null;
}

type ViewMode = "week" | "day" | "list";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDateFull(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getWeekDates(baseDate: Date): Date[] {
  const dayOfWeek = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8h - 19h

export default function AgendaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<{
    date?: string;
    time?: string;
  }>({});

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const dateFrom = weekDates[0].toISOString();
  const dateTo = new Date(
    weekDates[6].getTime() + 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: stats } = useAppointmentStats();
  const { data, isLoading } = useAppointments({
    dateFrom,
    dateTo,
    limit: 200,
  });
  const updateStatusMutation = useUpdateAppointmentStatus();
  const deleteMutation = useDeleteAppointment();

  const appointments: Appointment[] = data?.appointments ?? [];

  // Group appointments by date string
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach((appt) => {
      const dateKey = new Date(appt.startTime).toISOString().split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(appt);
    });
    return map;
  }, [appointments]);

  function navigateWeek(direction: number) {
    const next = new Date(currentDate);
    if (viewMode === "day") {
      next.setDate(next.getDate() + direction);
    } else {
      next.setDate(next.getDate() + direction * 7);
    }
    setCurrentDate(next);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function handleCellClick(date: Date, hour: number) {
    const dateStr = date.toISOString().split("T")[0];
    const timeStr = `${String(hour).padStart(2, "0")}:00`;
    setCreateDefaults({ date: dateStr, time: timeStr });
    setShowCreateDialog(true);
  }

  function handleStatusChange(id: string, status: string) {
    updateStatusMutation.mutate(
      { id, status },
      {
        onSuccess: () => {
          toast.success("Statut mis a jour");
          setSelectedAppointment(null);
        },
        onError: () => toast.error("Erreur lors du changement de statut"),
      }
    );
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("RDV supprime");
        setSelectedAppointment(null);
      },
      onError: () => toast.error("Erreur lors de la suppression"),
    });
  }

  // Get position and height for an appointment in the grid
  function getAppointmentStyle(appt: Appointment) {
    const start = new Date(appt.startTime);
    const end = new Date(appt.endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const topOffset = startMinutes - 8 * 60; // relative to 8:00
    const height = endMinutes - startMinutes;
    return {
      top: `${(topOffset / 60) * 64}px`,
      height: `${Math.max((height / 60) * 64, 24)}px`,
    };
  }

  function getStatusColor(status: string) {
    const colorMap: Record<string, string> = {
      SCHEDULED: "bg-blue-500",
      CONFIRMED: "bg-green-500",
      IN_PROGRESS: "bg-yellow-500",
      COMPLETED: "bg-gray-400",
      CANCELLED: "bg-red-400",
      NO_SHOW: "bg-orange-500",
      RESCHEDULED: "bg-purple-500",
    };
    return colorMap[status] || "bg-blue-500";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Calendrier et gestion des rendez-vous
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAvailability(!showAvailability)}
          >
            <Settings2 className="h-4 w-4 mr-1" />
            Disponibilites
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setCreateDefaults({});
              setShowCreateDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nouveau RDV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {stats?.today ?? 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aujourd&apos;hui
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {stats?.thisWeek ?? 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cette semaine
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">
                {stats?.upcoming ?? 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">A venir</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`h-4 w-4 ${(stats?.byStatus?.NO_SHOW ?? 0) > 0 ? "text-orange-500" : "text-muted-foreground"}`}
              />
              <span className="text-2xl font-bold">
                {stats?.byStatus?.NO_SHOW ?? 0}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">No-shows</p>
          </CardContent>
        </Card>
      </div>

      {/* Availability Manager */}
      {showAvailability && <AvailabilityManager />}

      {/* Calendar Nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Aujourd&apos;hui
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">
            {viewMode === "day"
              ? formatDateFull(currentDate)
              : `${formatDateShort(weekDates[0])} — ${formatDateShort(weekDates[6])}`}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {(["day", "week", "list"] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode(mode)}
            >
              {mode === "day" ? "Jour" : mode === "week" ? "Semaine" : "Liste"}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : viewMode === "list" ? (
        /* List View */
        <Card>
          <CardContent className="pt-4">
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun rendez-vous cette semaine
              </p>
            ) : (
              <div className="space-y-2">
                {appointments
                  .sort(
                    (a, b) =>
                      new Date(a.startTime).getTime() -
                      new Date(b.startTime).getTime()
                  )
                  .map((appt) => (
                    <div
                      key={appt.id}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedAppointment(appt)}
                    >
                      <div
                        className={`w-1 h-10 rounded-full ${getStatusColor(appt.status)}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {appt.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(appt.startTime).toLocaleDateString("fr-FR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          {formatTime(appt.startTime)} -{" "}
                          {formatTime(appt.endTime)}
                        </p>
                      </div>
                      {appt.prospect && (
                        <span className="text-xs text-muted-foreground">
                          {[appt.prospect.firstName, appt.prospect.lastName]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                      )}
                      <Badge
                        variant="secondary"
                        className={APPOINTMENT_STATUS_COLORS[appt.status] || ""}
                      >
                        {APPOINTMENT_STATUS_LABELS[appt.status] || appt.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Week / Day Grid View */
        <div className="border rounded-lg overflow-hidden bg-background">
          {/* Header */}
          <div className="grid border-b" style={{
            gridTemplateColumns: viewMode === "day" ? "60px 1fr" : "60px repeat(7, 1fr)",
          }}>
            <div className="p-2 border-r bg-muted/30" />
            {(viewMode === "day" ? [currentDate] : weekDates).map(
              (date, i) => {
                const dateKey = date.toISOString().split("T")[0];
                const dayApptCount =
                  appointmentsByDate[dateKey]?.length ?? 0;
                return (
                  <div
                    key={i}
                    className={`p-2 text-center border-r last:border-r-0 ${
                      isToday(date) ? "bg-primary/5" : "bg-muted/30"
                    }`}
                  >
                    <p
                      className={`text-xs font-medium ${
                        isToday(date)
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {date.toLocaleDateString("fr-FR", { weekday: "short" })}
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        isToday(date) ? "text-primary" : ""
                      }`}
                    >
                      {date.getDate()}
                    </p>
                    {dayApptCount > 0 && (
                      <Badge variant="secondary" className="text-xs mt-0.5">
                        {dayApptCount}
                      </Badge>
                    )}
                  </div>
                );
              }
            )}
          </div>

          {/* Time Grid */}
          <ScrollArea className="h-[640px]">
            <div className="relative">
              <div
                className="grid"
                style={{
                  gridTemplateColumns:
                    viewMode === "day"
                      ? "60px 1fr"
                      : "60px repeat(7, 1fr)",
                }}
              >
                {/* Time labels + empty cells */}
                {HOURS.map((hour) => (
                  <div key={`time-${hour}`} className="contents">
                    <div className="h-16 border-r border-b px-2 flex items-start pt-1 bg-muted/10">
                      <span className="text-xs text-muted-foreground font-mono">
                        {String(hour).padStart(2, "0")}:00
                      </span>
                    </div>
                    {(viewMode === "day" ? [currentDate] : weekDates).map(
                      (date, di) => (
                        <div
                          key={`cell-${hour}-${di}`}
                          className={`h-16 border-r border-b last:border-r-0 relative cursor-pointer hover:bg-muted/30 transition-colors ${
                            isToday(date) ? "bg-primary/[0.02]" : ""
                          }`}
                          onClick={() => handleCellClick(date, hour)}
                        />
                      )
                    )}
                  </div>
                ))}
              </div>

              {/* Appointment overlays */}
              {(viewMode === "day" ? [currentDate] : weekDates).map(
                (date, di) => {
                  const dateKey = date.toISOString().split("T")[0];
                  const dayAppts = appointmentsByDate[dateKey] || [];
                  const colCount = viewMode === "day" ? 1 : 7;
                  const colWidth = `calc((100% - 60px) / ${colCount})`;
                  const colOffset = `calc(60px + ${di} * ${colWidth})`;

                  return dayAppts.map((appt) => {
                    const style = getAppointmentStyle(appt);
                    return (
                      <div
                        key={appt.id}
                        className={`absolute rounded px-1.5 py-0.5 text-white text-xs cursor-pointer overflow-hidden border border-white/20 ${getStatusColor(appt.status)} hover:opacity-90 transition-opacity`}
                        style={{
                          top: style.top,
                          height: style.height,
                          left: colOffset,
                          width: `calc(${colWidth} - 4px)`,
                          marginLeft: "2px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(appt);
                        }}
                      >
                        <p className="font-medium truncate">{appt.title}</p>
                        <p className="opacity-80 truncate">
                          {formatTime(appt.startTime)} -{" "}
                          {formatTime(appt.endTime)}
                        </p>
                      </div>
                    );
                  });
                }
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Create Dialog */}
      <AppointmentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        defaultDate={createDefaults.date}
        defaultTime={createDefaults.time}
      />

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedAppointment}
        onOpenChange={() => setSelectedAppointment(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail du rendez-vous</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedAppointment.title}
                </h3>
                {selectedAppointment.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedAppointment.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Date & Heure</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedAppointment.startTime).toLocaleDateString(
                      "fr-FR",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      }
                    )}
                  </p>
                  <p className="text-sm">
                    {formatTime(selectedAppointment.startTime)} -{" "}
                    {formatTime(selectedAppointment.endTime)} (
                    {selectedAppointment.duration} min)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <Select
                    value={selectedAppointment.status}
                    onValueChange={(v) =>
                      handleStatusChange(selectedAppointment.id, v)
                    }
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(APPOINTMENT_STATUS_LABELS).map(
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

              {selectedAppointment.prospect && (
                <div>
                  <p className="text-xs text-muted-foreground">Prospect</p>
                  <p className="text-sm font-medium">
                    {[
                      selectedAppointment.prospect.firstName,
                      selectedAppointment.prospect.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                  {selectedAppointment.prospect.phone && (
                    <p className="text-xs text-muted-foreground">
                      {selectedAppointment.prospect.phone}
                    </p>
                  )}
                  {selectedAppointment.prospect.email && (
                    <p className="text-xs text-muted-foreground">
                      {selectedAppointment.prospect.email}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedAppointment.consultationType && (
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm">
                      {CONSULTATION_TYPES.find(
                        (ct) =>
                          ct.value === selectedAppointment.consultationType
                      )?.label || selectedAppointment.consultationType}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Reserve par</p>
                  <p className="text-sm">
                    {BOOKED_BY_LABELS[selectedAppointment.bookedBy] ||
                      selectedAppointment.bookedBy}
                  </p>
                </div>
              </div>

              {selectedAppointment.location && (
                <div>
                  <p className="text-xs text-muted-foreground">Lieu</p>
                  <p className="text-sm">{selectedAppointment.location}</p>
                </div>
              )}

              {selectedAppointment.isVirtual &&
                selectedAppointment.meetingUrl && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Lien visioconference
                    </p>
                    <a
                      href={selectedAppointment.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline"
                    >
                      {selectedAppointment.meetingUrl}
                    </a>
                  </div>
                )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(selectedAppointment.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  Supprimer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAppointment(null);
                    setShowCreateDialog(true);
                    setCreateDefaults({});
                  }}
                >
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
