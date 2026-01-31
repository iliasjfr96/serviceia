import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ── List Knowledge Documents ──────────────────────────────

export async function listKnowledgeDocuments(
  tenantId: string,
  options: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  } = {}
) {
  const { search, isActive, page = 1, limit = 20 } = options;

  const where: Prisma.KnowledgeDocumentWhereInput = { tenantId };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [documents, total] = await Promise.all([
    prisma.knowledgeDocument.findMany({
      where,
      include: {
        _count: { select: { chunks: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.knowledgeDocument.count({ where }),
  ]);

  return {
    documents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Get Knowledge Document ──────────────────────────────

export async function getKnowledgeDocument(
  tenantId: string,
  documentId: string
) {
  return prisma.knowledgeDocument.findFirst({
    where: { id: documentId, tenantId },
    include: {
      chunks: {
        orderBy: { chunkIndex: "asc" },
        select: {
          id: true,
          chunkIndex: true,
          content: true,
          tokenCount: true,
        },
      },
    },
  });
}

// ── Create Knowledge Document ──────────────────────────────

export interface CreateKnowledgeDocumentData {
  title: string;
  content: string;
  sourceType: string;
  sourceUrl?: string;
  fileUrl?: string;
  mimeType?: string;
  language?: string;
}

export async function createKnowledgeDocument(
  tenantId: string,
  data: CreateKnowledgeDocumentData
) {
  const doc = await prisma.knowledgeDocument.create({
    data: {
      tenantId,
      title: data.title,
      content: data.content,
      sourceType: data.sourceType,
      sourceUrl: data.sourceUrl,
      fileUrl: data.fileUrl,
      mimeType: data.mimeType,
      language: data.language ?? "fr",
      isActive: true,
    },
  });

  // Create simple chunks (split by paragraphs)
  const paragraphs = data.content
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0);

  if (paragraphs.length > 0) {
    await prisma.knowledgeChunk.createMany({
      data: paragraphs.map((content, index) => ({
        documentId: doc.id,
        content: content.trim(),
        chunkIndex: index,
        tokenCount: Math.ceil(content.trim().split(/\s+/).length * 1.3),
      })),
    });
  }

  return prisma.knowledgeDocument.findUnique({
    where: { id: doc.id },
    include: { _count: { select: { chunks: true } } },
  });
}

// ── Update Knowledge Document ──────────────────────────────

export async function updateKnowledgeDocument(
  tenantId: string,
  documentId: string,
  data: Partial<CreateKnowledgeDocumentData> & { isActive?: boolean }
) {
  const existing = await prisma.knowledgeDocument.findFirst({
    where: { id: documentId, tenantId },
  });
  if (!existing) return null;

  // If content changed, recreate chunks
  if (data.content && data.content !== existing.content) {
    await prisma.knowledgeChunk.deleteMany({
      where: { documentId },
    });

    const paragraphs = data.content
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 0);

    if (paragraphs.length > 0) {
      await prisma.knowledgeChunk.createMany({
        data: paragraphs.map((content, index) => ({
          documentId,
          content: content.trim(),
          chunkIndex: index,
          tokenCount: Math.ceil(content.trim().split(/\s+/).length * 1.3),
        })),
      });
    }
  }

  return prisma.knowledgeDocument.update({
    where: { id: documentId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.sourceType !== undefined
        ? { sourceType: data.sourceType }
        : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
    include: { _count: { select: { chunks: true } } },
  });
}

// ── Delete Knowledge Document ──────────────────────────────

export async function deleteKnowledgeDocument(
  tenantId: string,
  documentId: string
) {
  const existing = await prisma.knowledgeDocument.findFirst({
    where: { id: documentId, tenantId },
  });
  if (!existing) return null;

  // Chunks cascade on delete
  return prisma.knowledgeDocument.delete({
    where: { id: documentId },
  });
}

// ── Stats ──────────────────────────────

export async function getKnowledgeStats(tenantId: string) {
  const [totalDocs, activeDocs, totalChunks] = await Promise.all([
    prisma.knowledgeDocument.count({ where: { tenantId } }),
    prisma.knowledgeDocument.count({ where: { tenantId, isActive: true } }),
    prisma.knowledgeChunk.count({
      where: { document: { tenantId } },
    }),
  ]);

  return { totalDocs, activeDocs, totalChunks };
}
