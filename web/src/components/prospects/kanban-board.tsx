"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProspects, useUpdateProspectStage } from "@/hooks/use-prospects";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  STAGE_LABELS,
  STAGE_COLORS,
  URGENCY_COLORS,
  URGENCY_LABELS,
  STAGES_ORDER,
} from "@/lib/constants/pipeline";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  Loader2,
  Phone,
  Mail,
  GripVertical,
  AlertTriangle,
} from "lucide-react";

interface ProspectCard {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  stage: string;
  urgencyLevel: string;
  leadScore: number;
  isEmergency: boolean;
  practiceArea?: { name: string; color: string } | null;
}

function KanbanCard({
  prospect,
  isDragging,
}: {
  prospect: ProspectCard;
  isDragging?: boolean;
}) {
  const router = useRouter();
  const fullName =
    [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") ||
    "Sans nom";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: prospect.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? "shadow-lg ring-2 ring-primary" : ""
      }`}
      onClick={() => router.push(`/prospects/${prospect.id}`)}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm truncate">{fullName}</p>
            {prospect.isEmergency && (
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            )}
          </div>

          {prospect.practiceArea && (
            <p className="text-xs text-muted-foreground truncate">
              {prospect.practiceArea.name}
            </p>
          )}

          <div className="flex flex-col gap-1">
            {prospect.phone && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span className="truncate">{prospect.phone}</span>
              </span>
            )}
            {prospect.email && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="truncate">{prospect.email}</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className={`text-[10px] ${
                URGENCY_COLORS[prospect.urgencyLevel] || ""
              }`}
            >
              {URGENCY_LABELS[prospect.urgencyLevel] || prospect.urgencyLevel}
            </Badge>
            <div className="flex items-center gap-1">
              <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${prospect.leadScore}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {prospect.leadScore}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function KanbanColumn({
  stage,
  prospects,
}: {
  stage: string;
  prospects: ProspectCard[];
}) {
  return (
    <div className="flex flex-col min-w-[280px] w-[280px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={STAGE_COLORS[stage] || ""}>
            {STAGE_LABELS[stage] || stage}
          </Badge>
          <span className="text-sm text-muted-foreground font-medium">
            {prospects.length}
          </span>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <SortableContext
          items={prospects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 pb-4 pr-2 min-h-[200px]">
            {prospects.map((prospect) => (
              <KanbanCard key={prospect.id} prospect={prospect} />
            ))}
            {prospects.length === 0 && (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Aucun prospect
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

export function KanbanBoard() {
  const { data, isLoading } = useProspects({ limit: 200 });
  const stageMutation = useUpdateProspectStage();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const prospects: ProspectCard[] = data?.prospects ?? [];

  const prospectsByStage: Record<string, ProspectCard[]> = {};
  for (const stage of STAGES_ORDER) {
    prospectsByStage[stage] = prospects.filter((p) => p.stage === stage);
  }

  const activeProspect = activeId
    ? prospects.find((p) => p.id === activeId)
    : null;

  function findStageForProspect(id: string): string | undefined {
    for (const [stage, items] of Object.entries(prospectsByStage)) {
      if (items.some((p) => p.id === id)) return stage;
    }
    return undefined;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeStage = findStageForProspect(active.id as string);
    let overStage: string | undefined;

    // Check if dropped over a prospect card (find its stage)
    overStage = findStageForProspect(over.id as string);

    // If dropped over a stage column directly
    if (!overStage && STAGES_ORDER.includes(over.id as (typeof STAGES_ORDER)[number])) {
      overStage = over.id as string;
    }

    if (!overStage || activeStage === overStage) return;

    stageMutation.mutate(
      { id: active.id as string, stage: overStage },
      {
        onSuccess: () =>
          toast.success(
            `Prospect deplace vers ${STAGE_LABELS[overStage!] || overStage}`
          ),
        onError: () => toast.error("Erreur lors du deplacement"),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ height: "calc(100vh - 200px)" }}>
        {STAGES_ORDER.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            prospects={prospectsByStage[stage] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeProspect ? (
          <div className="w-[280px]">
            <KanbanCard prospect={activeProspect} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
