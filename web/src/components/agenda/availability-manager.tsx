"use client";

import { useState } from "react";
import {
  useAvailabilitySlots,
  useCreateAvailabilitySlot,
  useDeleteAvailabilitySlot,
} from "@/hooks/use-appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DAY_LABELS } from "@/lib/constants/appointments";
import { toast } from "sonner";
import { Plus, Trash2, Clock, Loader2 } from "lucide-react";

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferTime: number;
  maxBookings: number;
  isBlocked: boolean;
}

export function AvailabilityManager() {
  const { data: slots = [], isLoading } = useAvailabilitySlots();
  const createMutation = useCreateAvailabilitySlot();
  const deleteMutation = useDeleteAvailabilitySlot();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    dayOfWeek: "1",
    startTime: "09:00",
    endTime: "12:00",
    slotDuration: 30,
    bufferTime: 15,
  });

  function handleAdd() {
    createMutation.mutate(
      {
        dayOfWeek: parseInt(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        slotDuration: form.slotDuration,
        bufferTime: form.bufferTime,
      },
      {
        onSuccess: () => {
          toast.success("Creneau ajoute");
          setShowForm(false);
        },
        onError: () => toast.error("Erreur lors de l'ajout"),
      }
    );
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Creneau supprime"),
      onError: () => toast.error("Erreur lors de la suppression"),
    });
  }

  // Group slots by day
  const slotsByDay: Record<number, AvailabilitySlot[]> = {};
  (slots as AvailabilitySlot[]).forEach((slot) => {
    if (!slotsByDay[slot.dayOfWeek]) slotsByDay[slot.dayOfWeek] = [];
    slotsByDay[slot.dayOfWeek].push(slot);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Disponibilites
            </CardTitle>
            <CardDescription>
              Definissez vos creneaux de disponibilite pour la prise de RDV
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "outline" : "default"}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Jour</Label>
                <Select
                  value={form.dayOfWeek}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, dayOfWeek: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DAY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Debut</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fin</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duree (min)</Label>
                <Input
                  type="number"
                  value={form.slotDuration}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      slotDuration: parseInt(e.target.value) || 30,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pause (min)</Label>
                <Input
                  type="number"
                  value={form.bufferTime}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      bufferTime: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                )}
                Ajouter
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : Object.keys(slotsByDay).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun creneau de disponibilite configure
          </p>
        ) : (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const daySlots = slotsByDay[day];
              if (!daySlots || daySlots.length === 0) return null;
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-20">
                    {DAY_LABELS[day]}
                  </span>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center gap-1.5 group"
                      >
                        <Badge variant="secondary" className="font-mono">
                          {slot.startTime} - {slot.endTime}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ({slot.slotDuration}min)
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(slot.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
