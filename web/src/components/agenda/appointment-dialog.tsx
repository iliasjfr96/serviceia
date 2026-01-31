"use client";

import { useState, useEffect } from "react";
import { useCreateAppointment, useUpdateAppointment } from "@/hooks/use-appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { CONSULTATION_TYPES } from "@/lib/constants/appointments";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  prospectId?: string;
  bookedBy: string;
  prospect?: {
    id: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  defaultDate?: string;
  defaultTime?: string;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  defaultDate,
  defaultTime,
}: AppointmentDialogProps) {
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const isEdit = !!appointment;

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    startHour: "09:00",
    endHour: "09:30",
    duration: 30,
    consultationType: "",
    location: "",
    isVirtual: false,
    meetingUrl: "",
    prospectId: "",
    bookedBy: "MANUAL",
  });

  useEffect(() => {
    if (appointment) {
      const start = new Date(appointment.startTime);
      const end = new Date(appointment.endTime);
      setForm({
        title: appointment.title,
        description: appointment.description || "",
        date: start.toISOString().split("T")[0],
        startHour: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
        endHour: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
        duration: appointment.duration,
        consultationType: appointment.consultationType || "",
        location: appointment.location || "",
        isVirtual: appointment.isVirtual,
        meetingUrl: appointment.meetingUrl || "",
        prospectId: appointment.prospectId || "",
        bookedBy: appointment.bookedBy,
      });
    } else {
      setForm({
        title: "",
        description: "",
        date: defaultDate || new Date().toISOString().split("T")[0],
        startHour: defaultTime || "09:00",
        endHour: defaultTime
          ? (() => {
              const [h, m] = defaultTime.split(":").map(Number);
              const endMin = h * 60 + m + 30;
              return `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
            })()
          : "09:30",
        duration: 30,
        consultationType: "",
        location: "",
        isVirtual: false,
        meetingUrl: "",
        prospectId: "",
        bookedBy: "MANUAL",
      });
    }
  }, [appointment, defaultDate, defaultTime]);

  // Auto-calc duration on hour changes
  useEffect(() => {
    const [sh, sm] = form.startHour.split(":").map(Number);
    const [eh, em] = form.endHour.split(":").map(Number);
    const dur = (eh * 60 + em) - (sh * 60 + sm);
    if (dur > 0) {
      setForm((f) => ({ ...f, duration: dur }));
    }
  }, [form.startHour, form.endHour]);

  function handleSubmit() {
    if (!form.title || !form.date || !form.startHour || !form.endHour) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    const startTime = new Date(`${form.date}T${form.startHour}:00`).toISOString();
    const endTime = new Date(`${form.date}T${form.endHour}:00`).toISOString();

    const payload = {
      title: form.title,
      description: form.description || undefined,
      startTime,
      endTime,
      duration: form.duration,
      consultationType: form.consultationType || undefined,
      location: form.location || undefined,
      isVirtual: form.isVirtual,
      meetingUrl: form.meetingUrl || undefined,
      prospectId: form.prospectId || undefined,
      bookedBy: form.bookedBy,
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: appointment.id, data: payload },
        {
          onSuccess: () => {
            toast.success("RDV mis a jour");
            onOpenChange(false);
          },
          onError: () => toast.error("Erreur lors de la mise a jour"),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("RDV cree avec succes");
          onOpenChange(false);
        },
        onError: () => toast.error("Erreur lors de la creation"),
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Premiere consultation - Dupont"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Debut *</Label>
              <Input
                type="time"
                value={form.startHour}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startHour: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fin *</Label>
              <Input
                type="time"
                value={form.endHour}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endHour: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type de consultation</Label>
              <Select
                value={form.consultationType}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    consultationType: v === "none" ? "" : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {CONSULTATION_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>
                      {ct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duree</Label>
              <Input
                value={`${form.duration} min`}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lieu</Label>
            <Input
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              placeholder="Cabinet, salle 2..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Visioconference</p>
              <p className="text-xs text-muted-foreground">
                RDV en ligne
              </p>
            </div>
            <Switch
              checked={form.isVirtual}
              onCheckedChange={(v) =>
                setForm((f) => ({ ...f, isVirtual: v }))
              }
            />
          </div>

          {form.isVirtual && (
            <div className="space-y-2">
              <Label>Lien de la reunion</Label>
              <Input
                value={form.meetingUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, meetingUrl: e.target.value }))
                }
                placeholder="https://meet.google.com/..."
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Notes sur le rendez-vous..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Mettre a jour" : "Creer le RDV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
