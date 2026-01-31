"use client";

import { useEffect, useState } from "react";
import { useCabinet, useUpdateCabinet } from "@/hooks/use-cabinet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Building2, MapPin, Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CabinetSettingsPage() {
  const { data: cabinet, isLoading } = useCabinet();
  const updateMutation = useUpdateCabinet();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "FR",
    siret: "",
    website: "",
    timezone: "Europe/Paris",
    locale: "fr",
    rgpdContactEmail: "",
    dpoName: "",
  });

  useEffect(() => {
    if (cabinet) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: cabinet.name || "",
        email: cabinet.email || "",
        phone: cabinet.phone || "",
        address: cabinet.address || "",
        city: cabinet.city || "",
        postalCode: cabinet.postalCode || "",
        country: cabinet.country || "FR",
        siret: cabinet.siret || "",
        website: cabinet.website || "",
        timezone: cabinet.timezone || "Europe/Paris",
        locale: cabinet.locale || "fr",
        rgpdContactEmail: cabinet.rgpdContactEmail || "",
        dpoName: cabinet.dpoName || "",
      });
    }
  }, [cabinet]);

  function handleSave() {
    updateMutation.mutate(form, {
      onSuccess: () => toast.success("Informations du cabinet sauvegardees"),
      onError: () => toast.error("Erreur lors de la sauvegarde"),
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/parametres">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cabinet</h1>
          <p className="text-muted-foreground">
            Informations et coordonnees de votre cabinet
          </p>
        </div>
      </div>

      {/* Informations generales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Informations generales
          </CardTitle>
          <CardDescription>
            Nom, email et identification du cabinet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom du cabinet</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Cabinet Dupont & Associes"
              />
            </div>
            <div className="space-y-2">
              <Label>SIRET</Label>
              <Input
                value={form.siret}
                onChange={(e) =>
                  setForm((f) => ({ ...f, siret: e.target.value }))
                }
                placeholder="123 456 789 00012"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email de contact</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="contact@cabinet.fr"
              />
            </div>
            <div className="space-y-2">
              <Label>Telephone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Site web</Label>
            <Input
              value={form.website}
              onChange={(e) =>
                setForm((f) => ({ ...f, website: e.target.value }))
              }
              placeholder="https://www.cabinet.fr"
            />
          </div>
        </CardContent>
      </Card>

      {/* Adresse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Adresse
          </CardTitle>
          <CardDescription>
            Localisation du cabinet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
              placeholder="12 rue de la Paix"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
                placeholder="Paris"
              />
            </div>
            <div className="space-y-2">
              <Label>Code postal</Label>
              <Input
                value={form.postalCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, postalCode: e.target.value }))
                }
                placeholder="75002"
              />
            </div>
            <div className="space-y-2">
              <Label>Pays</Label>
              <Input
                value={form.country}
                onChange={(e) =>
                  setForm((f) => ({ ...f, country: e.target.value }))
                }
                placeholder="FR"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional & RGPD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" /> Regional & RGPD
          </CardTitle>
          <CardDescription>
            Parametres regionaux et contact RGPD
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fuseau horaire</Label>
              <Input
                value={form.timezone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timezone: e.target.value }))
                }
                placeholder="Europe/Paris"
              />
            </div>
            <div className="space-y-2">
              <Label>Langue</Label>
              <Input
                value={form.locale}
                onChange={(e) =>
                  setForm((f) => ({ ...f, locale: e.target.value }))
                }
                placeholder="fr"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email DPO / Contact RGPD</Label>
              <Input
                type="email"
                value={form.rgpdContactEmail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rgpdContactEmail: e.target.value }))
                }
                placeholder="dpo@cabinet.fr"
              />
            </div>
            <div className="space-y-2">
              <Label>Nom du DPO</Label>
              <Input
                value={form.dpoName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dpoName: e.target.value }))
                }
                placeholder="Me Jean Dupont"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          size="lg"
        >
          {updateMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Sauvegarder les informations
        </Button>
      </div>
    </div>
  );
}
