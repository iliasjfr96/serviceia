"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { format, parse, addDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, User, Mail, Phone, MessageSquare, Check, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface DaySlots {
  date: string;
  dayOfWeek: number;
  slots: TimeSlot[];
}

interface TenantInfo {
  name: string;
  slug: string;
  practiceAreas: string[];
}

type Step = "date" | "time" | "info" | "confirm" | "success";

export default function PublicBookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [step, setStep] = useState<Step>("date");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [slots, setSlots] = useState<DaySlots[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [practiceArea, setPracticeArea] = useState("");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false);

  const [bookingResult, setBookingResult] = useState<{
    id: string;
    startTime: string;
  } | null>(null);

  // Fetch available slots
  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      setError(null);

      try {
        const startDate = format(addDays(new Date(), weekOffset * 7), "yyyy-MM-dd");
        const res = await fetch(`/api/public/book/${slug}?date=${startDate}&weeks=1`);

        if (!res.ok) {
          if (res.status === 404) {
            setError("Cabinet introuvable");
          } else {
            setError("Erreur lors du chargement des disponibilites");
          }
          return;
        }

        const data = await res.json();
        setTenant(data.tenant);
        setSlots(data.slots);
      } catch {
        setError("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    }

    fetchSlots();
  }, [slug, weekOffset]);

  // Submit booking
  const handleSubmit = async () => {
    if (!selectedDate || !selectedSlot || !consent) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/public/book/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          firstName,
          lastName,
          email,
          phone,
          practiceArea: practiceArea || undefined,
          description: description || undefined,
          consent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de la reservation");
        return;
      }

      const data = await res.json();
      setBookingResult(data.appointment);
      setStep("success");
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  // Get dates for the current week
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    addDays(new Date(), weekOffset * 7 + i)
  );

  // Get available slots for selected date
  const selectedDaySlots = selectedDate
    ? slots.find((s) => s.date === selectedDate)?.slots.filter((s) => s.available) || []
    : [];

  if (loading && !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{tenant?.name}</h1>
          <p className="text-gray-600 mt-1">Reservez votre rendez-vous en ligne</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {["date", "time", "info", "confirm"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step === s || (step === "success" && s === "confirm")
                      ? "bg-primary text-primary-foreground"
                      : ["time", "info", "confirm"].indexOf(step) >=
                        ["time", "info", "confirm"].indexOf(s as Step)
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-200 text-gray-600"
                  )}
                >
                  {step === "success" && s === "confirm" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 3 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          {step === "date" && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Choisissez une date
                </CardTitle>
                <CardDescription>
                  Selectionnez le jour de votre rendez-vous
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
                    disabled={weekOffset === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Semaine precedente
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {format(weekDates[0], "d MMM", { locale: fr })} -{" "}
                    {format(weekDates[6], "d MMM yyyy", { locale: fr })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWeekOffset((w) => w + 1)}
                    disabled={weekOffset >= 3}
                  >
                    Semaine suivante
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {weekDates.map((date) => {
                    const dateStr = format(date, "yyyy-MM-dd");
                    const daySlots = slots.find((s) => s.date === dateStr);
                    const hasAvailable = daySlots?.slots.some((s) => s.available);
                    const isSelected = selectedDate === dateStr;
                    const isPast = date < new Date() && !isSameDay(date, new Date());

                    return (
                      <button
                        key={dateStr}
                        onClick={() => hasAvailable && setSelectedDate(dateStr)}
                        disabled={!hasAvailable || isPast}
                        className={cn(
                          "p-3 rounded-lg border text-center transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : hasAvailable && !isPast
                            ? "border-gray-200 hover:border-primary hover:bg-primary/5"
                            : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        <div className="text-xs font-medium">
                          {format(date, "EEE", { locale: fr })}
                        </div>
                        <div className="text-lg font-bold">{format(date, "d")}</div>
                      </button>
                    );
                  })}
                </div>

                {loading && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => setStep("time")}
                    disabled={!selectedDate}
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === "time" && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Choisissez une heure
                </CardTitle>
                <CardDescription>
                  {selectedDate &&
                    format(parse(selectedDate, "yyyy-MM-dd", new Date()), "EEEE d MMMM yyyy", {
                      locale: fr,
                    })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDaySlots.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun creneau disponible pour cette date
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {selectedDaySlots.map((slot) => (
                      <button
                        key={slot.startTime}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          "p-3 rounded-lg border text-center transition-colors",
                          selectedSlot?.startTime === slot.startTime
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-gray-200 hover:border-primary hover:bg-primary/5"
                        )}
                      >
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep("date")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button
                    onClick={() => setStep("info")}
                    disabled={!selectedSlot}
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === "info" && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Vos informations
                </CardTitle>
                <CardDescription>
                  Renseignez vos coordonnees pour confirmer le rendez-vous
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prenom</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean.dupont@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Telephone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                  />
                </div>

                {tenant?.practiceAreas && tenant.practiceAreas.length > 0 && (
                  <div>
                    <Label>Domaine juridique</Label>
                    <Select value={practiceArea} onValueChange={setPracticeArea}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectionnez un domaine" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenant.practiceAreas.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="description">
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    Motif du rendez-vous (optionnel)
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Decrivez brievement votre situation..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep("time")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button
                    onClick={() => setStep("confirm")}
                    disabled={!firstName || !lastName || !email || !phone}
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === "confirm" && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Confirmez votre reservation
                </CardTitle>
                <CardDescription>
                  Verifiez les informations et confirmez votre rendez-vous
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      {selectedDate &&
                        format(
                          parse(selectedDate, "yyyy-MM-dd", new Date()),
                          "EEEE d MMMM yyyy",
                          { locale: fr }
                        )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      {selectedSlot?.startTime} - {selectedSlot?.endTime}
                    </span>
                  </div>
                  <div className="border-t pt-3 mt-3">
                    <p className="font-medium">
                      {firstName} {lastName}
                    </p>
                    <p className="text-sm text-gray-600">{email}</p>
                    <p className="text-sm text-gray-600">{phone}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 mb-6">
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(v) => setConsent(v === true)}
                  />
                  <label htmlFor="consent" className="text-sm text-gray-600 leading-relaxed">
                    J&apos;accepte que mes donnees personnelles soient utilisees pour la gestion de
                    mon rendez-vous conformement a la politique de confidentialite.
                  </label>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">
                    {error}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep("info")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button onClick={handleSubmit} disabled={!consent || submitting}>
                    {submitting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Confirmer le rendez-vous
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {step === "success" && (
            <>
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Rendez-vous confirme !
                </h2>
                <p className="text-gray-600 mb-6">
                  Votre rendez-vous a ete enregistre avec succes.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 inline-block text-left mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      {bookingResult &&
                        format(new Date(bookingResult.startTime), "EEEE d MMMM yyyy", {
                          locale: fr,
                        })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      {bookingResult && format(new Date(bookingResult.startTime), "HH:mm")}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Un email de confirmation vous a ete envoye a {email}
                </p>
              </CardContent>
            </>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          Propulse par ServiceIA
        </div>
      </div>
    </div>
  );
}
