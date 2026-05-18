import { prisma } from "../db.js";

type SequenceScope = "invoice" | "offer" | "credit_note" | "reminder" | "document";

const DEFAULTS: Record<SequenceScope, { prefix: string; padding: number }> = {
  invoice: { prefix: "RE", padding: 4 },
  offer: { prefix: "AN", padding: 4 },
  credit_note: { prefix: "GS", padding: 4 },
  reminder: { prefix: "MA", padding: 4 },
  document: { prefix: "BE", padding: 4 },
};

export async function nextSequenceNumber(companyId: string, scope: SequenceScope, year = new Date().getFullYear()) {
  return prisma.$transaction(async (tx) => {
    const defaults = DEFAULTS[scope];
    const sequence = await tx.numberSequence.upsert({
      where: { companyId_scope_year: { companyId, scope, year } },
      update: {},
      create: {
        companyId,
        scope,
        year,
        prefix: defaults.prefix,
        padding: defaults.padding,
        nextNumber: 1,
      },
    });
    const value = `${sequence.prefix}-${year}-${String(sequence.nextNumber).padStart(sequence.padding, "0")}`;
    await tx.numberSequence.update({
      where: { id: sequence.id },
      data: { nextNumber: sequence.nextNumber + 1 },
    });
    return value;
  });
}

