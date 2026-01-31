"use client";

import { useState } from "react";
import {
  useTeamMembers,
  useInviteTeamMember,
  useUpdateTeamMember,
  useRemoveTeamMember,
} from "@/hooks/use-team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Loader2,
  Users2,
  Plus,
  Shield,
  User,
  UserX,
  UserCheck,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrateur",
  MEMBER: "Membre",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  MEMBER: "bg-gray-100 text-gray-800",
};

export default function EquipePage() {
  const { data: members, isLoading } = useTeamMembers();
  const inviteMutation = useInviteTeamMember();
  const updateMutation = useUpdateTeamMember();
  const removeMutation = useRemoveTeamMember();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER",
  });

  function resetForm() {
    setForm({ name: "", email: "", password: "", role: "MEMBER" });
  }

  function handleInvite() {
    inviteMutation.mutate(form, {
      onSuccess: () => {
        toast.success("Membre ajoute a l'equipe");
        setInviteOpen(false);
        resetForm();
      },
      onError: (error) => toast.error(error.message),
    });
  }

  function handleRoleChange(id: string, role: string) {
    updateMutation.mutate(
      { id, role },
      {
        onSuccess: () => toast.success("Role mis a jour"),
        onError: (error) => toast.error(error.message),
      }
    );
  }

  function handleToggleActive(member: TeamMember) {
    updateMutation.mutate(
      { id: member.id, isActive: !member.isActive },
      {
        onSuccess: () =>
          toast.success(
            member.isActive ? "Compte desactive" : "Compte reactive"
          ),
        onError: (error) => toast.error(error.message),
      }
    );
  }

  function handleRemove() {
    if (!removeId) return;
    removeMutation.mutate(removeId, {
      onSuccess: () => {
        toast.success("Membre desactive");
        setRemoveId(null);
      },
      onError: (error) => toast.error(error.message),
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const teamMembers: TeamMember[] = members || [];
  const activeCount = teamMembers.filter((m) => m.isActive).length;
  const adminCount = teamMembers.filter(
    (m) => m.role === "ADMIN" || m.role === "SUPER_ADMIN"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/parametres">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Equipe</h1>
            <p className="text-muted-foreground">
              Gerez les membres et les permissions de votre cabinet
            </p>
          </div>
        </div>
        <Dialog
          open={inviteOpen}
          onOpenChange={(v) => {
            setInviteOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Ajouter un membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un membre</DialogTitle>
              <DialogDescription>
                Creez un compte pour un nouveau membre de l&apos;equipe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Me Jean Dupont"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="jean.dupont@cabinet.fr"
                />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="Minimum 8 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">
                      Administrateur - Acces complet
                    </SelectItem>
                    <SelectItem value="MEMBER">
                      Membre - Acces limite
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setInviteOpen(false);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleInvite}
                disabled={
                  !form.name ||
                  !form.email ||
                  !form.password ||
                  inviteMutation.isPending
                }
              >
                {inviteMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
                <p className="text-xs text-muted-foreground">Membres totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{adminCount}</p>
                <p className="text-xs text-muted-foreground">
                  Administrateurs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Table */}
      <Card>
        <CardHeader>
          <CardTitle>Membres de l&apos;equipe</CardTitle>
          <CardDescription>
            Gerez les roles et l&apos;acces de chaque membre
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucun membre dans l&apos;equipe
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Derniere connexion</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.role === "SUPER_ADMIN" ? (
                        <Badge className={ROLE_COLORS[member.role]}>
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      ) : (
                        <Select
                          value={member.role}
                          onValueChange={(v) =>
                            handleRoleChange(member.id, v)
                          }
                        >
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">
                              Administrateur
                            </SelectItem>
                            <SelectItem value="MEMBER">Membre</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={member.isActive ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (member.role !== "SUPER_ADMIN") {
                            handleToggleActive(member);
                          }
                        }}
                      >
                        {member.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.lastLoginAt
                        ? new Date(member.lastLoginAt).toLocaleDateString(
                            "fr",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "Jamais"}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== "SUPER_ADMIN" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoveId(member.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Remove Confirmation */}
      <AlertDialog
        open={!!removeId}
        onOpenChange={(v) => !v && setRemoveId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactiver ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le compte sera desactive et l&apos;utilisateur ne pourra plus se
              connecter. Ses donnees seront conservees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
