"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateProspect } from "@/hooks/use-prospects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { URGENCY_LABELS, SOURCE_LABELS } from "@/lib/constants/pipeline";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ProspectForm() {
  const router = useRouter();
  const createMutation = useCreateProspect();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    address: "",
    city: "",
    postalCode: "",
    source: "OTHER",
    urgencyLevel: "NORMAL",
    caseDescription: "",
    referralSource: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.firstName && !form.lastName && !form.phone && !form.email) {
      toast.error("Veuillez remplir au moins un champ d'identification");
      return;
    }

    createMutation.mutate(form, {
      onSuccess: (data) => {
        toast.success("Prospect cree avec succes");
        router.push(`/prospects/${data.id}`);
      },
      onError: () => {
        toast.error("Erreur lors de la creation du prospect");
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prenom</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="Jean"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="Dupont"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telephone</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+33 6 12 34 56 78"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="jean.dupont@email.fr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alternatePhone">Telephone secondaire</Label>
            <Input
              id="alternatePhone"
              type="tel"
              value={form.alternatePhone}
              onChange={(e) => updateField("alternatePhone", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Adresse</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Code postal</Label>
            <Input
              id="postalCode"
              value={form.postalCode}
              onChange={(e) => updateField("postalCode", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Qualification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Source</Label>
            <Select
              value={form.source}
              onValueChange={(v) => updateField("source", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Urgence</Label>
            <Select
              value={form.urgencyLevel}
              onValueChange={(v) => updateField("urgencyLevel", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(URGENCY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="referralSource">Source de recommandation</Label>
            <Input
              id="referralSource"
              value={form.referralSource}
              onChange={(e) => updateField("referralSource", e.target.value)}
              placeholder="Ex: Me Martin, Google..."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="caseDescription">Description du dossier</Label>
            <Textarea
              id="caseDescription"
              value={form.caseDescription}
              onChange={(e) => updateField("caseDescription", e.target.value)}
              placeholder="Decrivez brievement la situation juridique du prospect..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Creer le prospect
        </Button>
      </div>
    </form>
  );
}
