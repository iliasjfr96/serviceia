import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Building2,
  Bot,
  BookOpen,
  Link2,
  Shield,
  Users2,
} from "lucide-react";

const settingsSections = [
  {
    title: "Cabinet",
    description: "Informations du cabinet, coordonnees et logo",
    href: "/parametres/cabinet",
    icon: Building2,
  },
  {
    title: "Agent IA",
    description: "Configuration webhook ElevenLabs et urgences",
    href: "/parametres/agent",
    icon: Bot,
  },
  {
    title: "Base de connaissances",
    description: "Documents FAQ, tarifs et procedures",
    href: "/parametres/knowledge-base",
    icon: BookOpen,
  },
  {
    title: "Integrations",
    description: "Google Calendar, SMS, Email",
    href: "/parametres/integrations",
    icon: Link2,
  },
  {
    title: "RGPD",
    description: "Retention, consentement et conformite",
    href: "/parametres/rgpd",
    icon: Shield,
  },
  {
    title: "Equipe",
    description: "Gestion des membres et permissions",
    href: "/parametres/equipe",
    icon: Users2,
  },
];

export default function ParametresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Parametres</h1>
        <p className="text-muted-foreground">
          Configuration de votre cabinet et de l&apos;agent IA
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <section.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
