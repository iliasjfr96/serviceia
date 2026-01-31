"use client";

import { use } from "react";
import { ProspectDetail } from "@/components/prospects/prospect-detail";

export default function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <ProspectDetail prospectId={id} />;
}
