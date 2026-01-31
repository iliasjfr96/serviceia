"use client";

import { useState } from "react";
import { useAddNote } from "@/hooks/use-prospects";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pin, Send, User, Bot, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Note {
  id: string;
  content: string;
  type: string;
  isPinned: boolean;
  createdAt: string;
  author?: { id: string; name: string } | null;
}

const NOTE_TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof User; color: string }
> = {
  MANUAL: { label: "Note", icon: User, color: "bg-blue-100 text-blue-700" },
  AI_SUMMARY: { label: "Resume IA", icon: Bot, color: "bg-purple-100 text-purple-700" },
  SYSTEM: { label: "Systeme", icon: Settings2, color: "bg-gray-100 text-gray-700" },
  FOLLOW_UP: { label: "Suivi", icon: Send, color: "bg-green-100 text-green-700" },
};

export function NotesSection({
  prospectId,
  notes,
}: {
  prospectId: string;
  notes: Note[];
}) {
  const [content, setContent] = useState("");
  const addNoteMutation = useAddNote();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    addNoteMutation.mutate(
      { prospectId, content: content.trim() },
      {
        onSuccess: () => {
          setContent("");
          toast.success("Note ajoutee");
        },
        onError: () => toast.error("Erreur lors de l'ajout de la note"),
      }
    );
  }

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const otherNotes = notes.filter((n) => !n.isPinned);
  const sortedNotes = [...pinnedNotes, ...otherNotes];

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ajouter une note..."
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || addNoteMutation.isPending}
          >
            {addNoteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Ajouter
          </Button>
        </div>
      </form>

      {/* Notes list */}
      <div className="space-y-3">
        {sortedNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune note pour ce prospect
          </p>
        ) : (
          sortedNotes.map((note) => {
            const config = NOTE_TYPE_CONFIG[note.type] || NOTE_TYPE_CONFIG.MANUAL;
            const Icon = config.icon;
            return (
              <div
                key={note.id}
                className="rounded-lg border p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={config.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                    {note.isPinned && (
                      <Pin className="h-3 w-3 text-amber-500" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(note.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                {note.author && (
                  <p className="text-xs text-muted-foreground">
                    Par {note.author.name}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
