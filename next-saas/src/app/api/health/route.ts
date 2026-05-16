import { ok } from "@/server/api/response";

export async function GET() {
  return ok({ service: "next-saas", status: "up", date: new Date().toISOString() });
}
