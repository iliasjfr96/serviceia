import { Bot } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Bot className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">ServiceIA</h1>
          <p className="text-sm text-muted-foreground text-center">
            Reception augmentee par IA pour cabinets d&apos;avocats
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
