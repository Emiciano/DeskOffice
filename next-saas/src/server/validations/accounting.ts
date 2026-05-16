import { DocumentStatus, DocumentType } from "@prisma/client";
import { z } from "zod";

export const createDocumentSchema = z.object({
  fileName: z.string().min(2),
  mimeType: z.string().min(3),
  fileUrl: z.string().url(),
  type: z.nativeEnum(DocumentType).optional(),
  invoiceNumber: z.string().optional(),
  partnerName: z.string().optional(),
  grossAmount: z.number().nonnegative().default(0),
  netAmount: z.number().nonnegative().default(0),
  vatAmount: z.number().nonnegative().default(0),
  category: z.string().optional()
});

export const updateDocumentSchema = createDocumentSchema.partial().extend({
  status: z.nativeEnum(DocumentStatus).optional(),
  documentDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional()
});

export const createBookingSchema = z.object({
  documentId: z.string().min(3),
  debitAccount: z.string().min(3),
  creditAccount: z.string().min(3),
  amount: z.number().positive(),
  taxAmount: z.number().nonnegative().default(0),
  bookingText: z.string().min(3),
  bookingDate: z.string().datetime()
});
