"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Plus,
  Building2,
  Users,
  Phone,
  UserCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Rocket,
  Eye,
  FileText,
} from "lucide-react";
import {
  useAdminStats,
  useTenants,
  useTenant,
  useCreateTenant,
  useUpdateTenant,
  useOnboardTenant,
  useAuditLogs,
} from "@/hooks/use-admin";
import {
  TENANT_PLAN_LABELS,
  TENANT_PLAN_COLORS,
  USER_ROLE_LABELS,
  USER_ROLE_COLORS,
} from "@/lib/constants/tenants";

// ── Create Tenant Dialog ──────────────────────────────

function CreateTenantDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [siret, setSiret] = useState("");
  const [plan, setPlan] = useState("STARTER");
  const [monthlyFee, setMonthlyFee] = useState("");
  const createTenant = useCreateTenant();

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = () => {
    if (!name || !slug || !email) return;

    createTenant.mutate(
      {
        name,
        slug,
        email,
        phone: phone || undefined,
        city: city || undefined,
        siret: siret || undefined,
        plan,
        monthlyFee: monthlyFee ? parseFloat(monthlyFee) : undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setSlug("");
          setEmail("");
          setPhone("");
          setCity("");
          setSiret("");
          setPlan("STARTER");
          setMonthlyFee("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau cabinet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Onboarder un nouveau cabinet</DialogTitle>
          <DialogDescription>
            Creez un nouveau tenant pour un cabinet client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tenant-name">Nom du cabinet *</Label>
              <Input
                id="tenant-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Cabinet Dupont"
              />
            </div>
            <div>
              <Label htmlFor="tenant-slug">Slug *</Label>
              <Input
                id="tenant-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="cabinet-dupont"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tenant-email">Email *</Label>
              <Input
                id="tenant-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@cabinet-dupont.fr"
              />
            </div>
            <div>
              <Label htmlFor="tenant-phone">Telephone</Label>
              <Input
                id="tenant-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tenant-city">Ville</Label>
              <Input
                id="tenant-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Paris"
              />
            </div>
            <div>
              <Label htmlFor="tenant-siret">SIRET</Label>
              <Input
                id="tenant-siret"
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                placeholder="123 456 789 00012"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Plan</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TENANT_PLAN_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tenant-fee">Tarif mensuel (EUR)</Label>
              <Input
                id="tenant-fee"
                type="number"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                placeholder="299"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !name || !slug || !email || createTenant.isPending
            }
          >
            {createTenant.isPending ? "Creation..." : "Creer le cabinet"}
          </Button>
        </DialogFooter>
        {createTenant.isError && (
          <p className="text-sm text-destructive">
            {createTenant.error.message}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Tenant Detail Sheet ──────────────────────────────

function TenantDetailSheet({
  tenantId,
  open,
  onOpenChange,
}: {
  tenantId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: tenant } = useTenant(tenantId);
  const updateTenant = useUpdateTenant();
  const onboardTenant = useOnboardTenant();

  if (!tenant) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {tenant.name}
          </SheetTitle>
          <SheetDescription>{tenant.email}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status & Plan */}
          <div className="flex items-center gap-3">
            <Badge className={TENANT_PLAN_COLORS[tenant.plan] || ""}>
              {TENANT_PLAN_LABELS[tenant.plan] || tenant.plan}
            </Badge>
            <Badge variant={tenant.isActive ? "default" : "destructive"}>
              {tenant.isActive ? "Actif" : "Inactif"}
            </Badge>
            {tenant.onboardedAt && (
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Onboarde
              </Badge>
            )}
          </div>

          {/* Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {tenant.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telephone</span>
                  <span>{tenant.phone}</span>
                </div>
              )}
              {tenant.city && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ville</span>
                  <span>{tenant.city}</span>
                </div>
              )}
              {tenant.siret && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SIRET</span>
                  <span>{tenant.siret}</span>
                </div>
              )}
              {tenant.monthlyFee && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarif mensuel</span>
                  <span>{Number(tenant.monthlyFee).toFixed(2)} EUR</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cree le</span>
                <span>
                  {new Date(tenant.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Utilisation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">
                    {tenant._count?.users ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Utilisateurs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {tenant._count?.prospects ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Prospects</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {tenant._count?.calls ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Appels</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center mt-3">
                <div>
                  <p className="text-2xl font-bold">
                    {tenant._count?.appointments ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">RDV</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {tenant._count?.automationRules ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Regles</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {tenant._count?.campaigns ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Campagnes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          {tenant.users && tenant.users.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Equipe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tenant.users.map(
                  (user: {
                    id: string;
                    name: string;
                    email: string;
                    role: string;
                    isActive: boolean;
                    lastLoginAt: string | null;
                  }) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between py-2 border-b last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={USER_ROLE_COLORS[user.role] || ""}
                          variant="secondary"
                        >
                          {USER_ROLE_LABELS[user.role] || user.role}
                        </Badge>
                        {!user.isActive && (
                          <Badge variant="destructive">Inactif</Badge>
                        )}
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!tenant.onboardedAt && (
              <Button
                onClick={() => onboardTenant.mutate(tenant.id)}
                disabled={onboardTenant.isPending}
              >
                <Rocket className="mr-2 h-4 w-4" />
                {onboardTenant.isPending ? "Onboarding..." : "Marquer comme onboarde"}
              </Button>
            )}
            <Button
              variant={tenant.isActive ? "destructive" : "default"}
              onClick={() =>
                updateTenant.mutate({
                  id: tenant.id,
                  data: { isActive: !tenant.isActive },
                })
              }
              disabled={updateTenant.isPending}
            >
              {tenant.isActive ? (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Suspendre
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Reactiver
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Slug Helper ──────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Main Page ──────────────────────────────

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [auditPage, setAuditPage] = useState(1);

  const { data: stats } = useAdminStats();
  const { data: tenantsData, isLoading: tenantsLoading } = useTenants({
    search: search || undefined,
    plan: planFilter || undefined,
    page,
    limit: 15,
  });
  const { data: auditData, isLoading: auditLoading } = useAuditLogs({
    page: auditPage,
    limit: 20,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantsList = (tenantsData as any)?.tenants || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantsPagination = (tenantsData as any)?.pagination;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auditList = (auditData as any)?.logs || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auditPagination = (auditData as any)?.pagination;

  const openTenantDetail = (id: string) => {
    setSelectedTenantId(id);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
          <p className="text-muted-foreground">
            Gestion des cabinets clients et vue d&apos;ensemble de
            l&apos;agence
          </p>
        </div>
        <CreateTenantDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Cabinets</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeTenants ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.inactiveTenants ?? 0} inactifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalUsers ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              sur {stats?.totalTenants ?? 0} cabinets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Appels</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalCalls ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalProspects ?? 0} prospects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">RDV</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalAppointments ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">total</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      {stats?.planDistribution && (
        <div className="flex gap-3">
          {Object.entries(stats.planDistribution as Record<string, number>).map(
            ([plan, count]) => (
              <Badge
                key={plan}
                variant="outline"
                className="text-sm py-1 px-3"
              >
                {TENANT_PLAN_LABELS[plan] || plan}: {count}
              </Badge>
            )
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="tenants">
        <TabsList>
          <TabsTrigger value="tenants">Cabinets</TabsTrigger>
          <TabsTrigger value="audit">Journal d&apos;audit</TabsTrigger>
        </TabsList>

        {/* ── Tenants Tab ──────────────────────────────── */}
        <TabsContent value="tenants" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un cabinet..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={planFilter}
              onValueChange={(v) => {
                setPlanFilter(v === "ALL" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tous les plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les plans</SelectItem>
                {Object.entries(TENANT_PLAN_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tenants Table */}
          {tenantsLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Chargement des cabinets...
              </CardContent>
            </Card>
          ) : tenantsList.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun cabinet trouve</p>
                <p className="text-xs mt-1">
                  {search
                    ? "Essayez une autre recherche"
                    : "Creez votre premier cabinet client"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cabinet</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="text-center">
                        Utilisateurs
                      </TableHead>
                      <TableHead className="text-center">Prospects</TableHead>
                      <TableHead className="text-center">Appels</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenantsList.map(
                      (tenant: {
                        id: string;
                        name: string;
                        email: string;
                        slug: string;
                        plan: string;
                        isActive: boolean;
                        onboardedAt: string | null;
                        createdAt: string;
                        _count: {
                          users: number;
                          prospects: number;
                          calls: number;
                          appointments: number;
                        };
                      }) => (
                        <TableRow
                          key={tenant.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => openTenantDetail(tenant.id)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{tenant.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {tenant.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                TENANT_PLAN_COLORS[tenant.plan] || ""
                              }
                            >
                              {TENANT_PLAN_LABELS[tenant.plan] || tenant.plan}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {tenant._count.users}
                          </TableCell>
                          <TableCell className="text-center">
                            {tenant._count.prospects}
                          </TableCell>
                          <TableCell className="text-center">
                            {tenant._count.calls}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {tenant.isActive ? (
                                <Badge
                                  variant="outline"
                                  className="text-green-600 border-green-300"
                                >
                                  Actif
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Inactif</Badge>
                              )}
                              {tenant.onboardedAt && (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openTenantDetail(tenant.id);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </Card>

              {/* Pagination */}
              {tenantsPagination && tenantsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {tenantsPagination.page} sur{" "}
                    {tenantsPagination.totalPages} ({tenantsPagination.total}{" "}
                    cabinets)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= tenantsPagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Audit Log Tab ──────────────────────────────── */}
        <TabsContent value="audit" className="space-y-4">
          {auditLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Chargement du journal d&apos;audit...
              </CardContent>
            </Card>
          ) : auditList.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune entree dans le journal d&apos;audit</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Cabinet</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entite</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditList.map(
                      (log: {
                        id: string;
                        createdAt: string;
                        action: string;
                        entityType: string | null;
                        entityId: string | null;
                        user: {
                          id: string;
                          name: string;
                          email: string;
                        } | null;
                        tenant: {
                          id: string;
                          name: string;
                        } | null;
                      }) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {new Date(log.createdAt).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.user?.name || "Systeme"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.tenant?.name || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.action}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.entityType
                              ? `${log.entityType}${log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}`
                              : "—"}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </Card>

              {/* Audit Pagination */}
              {auditPagination && auditPagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {auditPagination.page} sur{" "}
                    {auditPagination.totalPages} ({auditPagination.total}{" "}
                    entrees)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={auditPage <= 1}
                      onClick={() => setAuditPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={auditPage >= auditPagination.totalPages}
                      onClick={() => setAuditPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Tenant Detail Sheet */}
      <TenantDetailSheet
        tenantId={selectedTenantId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
