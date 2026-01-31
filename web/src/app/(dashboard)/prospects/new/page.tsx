import { ProspectForm } from "@/components/prospects/prospect-form";

export default function NewProspectPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Nouveau prospect
        </h1>
        <p className="text-muted-foreground">
          Ajoutez un nouveau prospect manuellement
        </p>
      </div>
      <ProspectForm />
    </div>
  );
}
