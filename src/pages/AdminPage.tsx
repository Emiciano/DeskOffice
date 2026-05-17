import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type RoleRow = { id: string; code: string; label: string; permissions: string; system: boolean };
type MemberRow = {
  id: string;
  status: string;
  user: { id: string; name: string; email: string };
  role: { id: string; code: string; label: string } | null;
};
type SubRow = { id: string; planCode: string; status: string; seats: number; currentPeriodEnd?: string | null };
type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  createdAt: string;
};
type BankAccountRow = { id: string; name: string; iban: string; bic?: string | null; bankName?: string | null; active: boolean };
type CostCenterRow = { id: string; code: string; name: string; active: boolean };

type Section = "roles" | "members" | "subscription" | "finance" | "audit";

const sections: Array<{ id: Section; label: string }> = [
  { id: "roles", label: "Rollen" },
  { id: "members", label: "Mitglieder" },
  { id: "subscription", label: "Subscription" },
  { id: "finance", label: "Bank & Kostenstellen" },
  { id: "audit", label: "Audit Log" },
];

export function AdminPage() {
  const [companyId, setCompanyId] = useState("");
  const [active, setActive] = useState<Section>("roles");
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountRow[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenterRow[]>([]);

  const [roleCode, setRoleCode] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [rolePerms, setRolePerms] = useState("");
  const [subPlan, setSubPlan] = useState("starter");
  const [subSeats, setSubSeats] = useState(3);
  const [bankName, setBankName] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankBic, setBankBic] = useState("");
  const [ccCode, setCcCode] = useState("");
  const [ccName, setCcName] = useState("");
  const [message, setMessage] = useState("");

  async function loadAll(company: string) {
    const [r, m, s, a, b, c] = await Promise.all([
      apiFetch(`/api/admin/roles?companyId=${company}`),
      apiFetch(`/api/admin/members?companyId=${company}`),
      apiFetch(`/api/admin/subscriptions?companyId=${company}`),
      apiFetch(`/api/admin/audit-logs?companyId=${company}`),
      apiFetch(`/api/finance-config/bank-accounts?companyId=${company}`),
      apiFetch(`/api/finance-config/cost-centers?companyId=${company}`),
    ]);
    setRoles(await r.json());
    setMembers(await m.json());
    setSubs(await s.json());
    setAudit(await a.json());
    setBankAccounts(await b.json());
    setCostCenters(await c.json());
  }

  useEffect(() => {
    void (async () => {
      const boot = await apiFetch("/api/bootstrap").then((r) => r.json());
      if (!boot.companyId) return;
      const id = String(boot.companyId);
      setCompanyId(id);
      await loadAll(id);
    })();
  }, []);

  async function createRole() {
    if (!companyId || !roleCode.trim() || !roleLabel.trim()) return;
    const res = await apiFetch(`/api/admin/roles?companyId=${companyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        code: roleCode.trim().toLowerCase(),
        label: roleLabel.trim(),
        permissions: rolePerms.split(",").map((x) => x.trim()).filter(Boolean),
      }),
    });
    if (!res.ok) return setMessage("Rolle konnte nicht erstellt werden.");
    setRoleCode("");
    setRoleLabel("");
    setRolePerms("");
    setMessage("Rolle erstellt.");
    await loadAll(companyId);
  }

  async function createSubscription() {
    if (!companyId) return;
    const res = await apiFetch(`/api/admin/subscriptions?companyId=${companyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, planCode: subPlan, status: "active", seats: subSeats }),
    });
    if (!res.ok) return setMessage("Subscription konnte nicht erstellt werden.");
    setMessage("Subscription erstellt.");
    await loadAll(companyId);
  }

  async function createBankAccount() {
    if (!companyId || !bankIban.trim()) return;
    const res = await apiFetch(`/api/finance-config/bank-accounts?companyId=${companyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, name: bankName || "Hauptkonto", iban: bankIban, bic: bankBic }),
    });
    if (!res.ok) return setMessage("Bankkonto konnte nicht erstellt werden.");
    setBankName("");
    setBankIban("");
    setBankBic("");
    setMessage("Bankkonto erstellt.");
    await loadAll(companyId);
  }

  async function createCostCenter() {
    if (!companyId || !ccCode.trim() || !ccName.trim()) return;
    const res = await apiFetch(`/api/finance-config/cost-centers?companyId=${companyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, code: ccCode, name: ccName }),
    });
    if (!res.ok) return setMessage("Kostenstelle konnte nicht erstellt werden.");
    setCcCode("");
    setCcName("");
    setMessage("Kostenstelle erstellt.");
    await loadAll(companyId);
  }

  return (
    <div>
      <PageHeader title="Admin & Compliance" subtitle="Rollen, Mitglieder, Subscription, Finanzen und Audit-Logs" />
      {message ? <div className="mb-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">{message}</div> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {sections.map((s) => (
          <Button key={s.id} variant={active === s.id ? "default" : "outline"} onClick={() => setActive(s.id)}>
            {s.label}
          </Button>
        ))}
      </div>

      {active === "roles" ? (
        <Card>
          <div className="mb-3 grid gap-2 md:grid-cols-4">
            <Input placeholder="Code (z. B. manager)" value={roleCode} onChange={(e) => setRoleCode(e.target.value)} />
            <Input placeholder="Label" value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} />
            <Input placeholder="Permissions CSV" value={rolePerms} onChange={(e) => setRolePerms(e.target.value)} />
            <Button onClick={() => void createRole()}>Rolle anlegen</Button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th>Code</th><th>Label</th><th>System</th><th>Permissions</th></tr></thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-2">{r.code}</td>
                  <td>{r.label}</td>
                  <td>{r.system ? "Ja" : "Nein"}</td>
                  <td className="max-w-[420px] truncate" title={r.permissions}>{r.permissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {active === "members" ? (
        <Card>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th>Name</th><th>E-Mail</th><th>Rolle</th><th>Status</th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="py-2">{m.user.name}</td>
                  <td>{m.user.email}</td>
                  <td>{m.role?.label ?? "-"}</td>
                  <td>{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {active === "subscription" ? (
        <Card>
          <div className="mb-3 grid gap-2 md:grid-cols-3">
            <Input placeholder="Plan (starter, pro, enterprise)" value={subPlan} onChange={(e) => setSubPlan(e.target.value)} />
            <Input type="number" min={1} value={subSeats} onChange={(e) => setSubSeats(Number(e.target.value) || 1)} />
            <Button onClick={() => void createSubscription()}>Subscription anlegen</Button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th>Plan</th><th>Status</th><th>Seats</th><th>Period End</th></tr></thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-2">{s.planCode}</td>
                  <td>{s.status}</td>
                  <td>{s.seats}</td>
                  <td>{s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toISOString().slice(0, 10) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}

      {active === "finance" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <div className="mb-3 grid gap-2 md:grid-cols-4">
              <Input placeholder="Kontoname" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              <Input placeholder="IBAN" value={bankIban} onChange={(e) => setBankIban(e.target.value)} />
              <Input placeholder="BIC" value={bankBic} onChange={(e) => setBankBic(e.target.value)} />
              <Button onClick={() => void createBankAccount()}>Bankkonto anlegen</Button>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th>Name</th><th>IBAN</th><th>BIC</th><th>Status</th></tr></thead>
              <tbody>
                {bankAccounts.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="py-2">{b.name}</td>
                    <td>{b.iban}</td>
                    <td>{b.bic || "-"}</td>
                    <td>{b.active ? "Aktiv" : "Inaktiv"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card>
            <div className="mb-3 grid gap-2 md:grid-cols-3">
              <Input placeholder="Code (z. B. MKT-01)" value={ccCode} onChange={(e) => setCcCode(e.target.value)} />
              <Input placeholder="Name" value={ccName} onChange={(e) => setCcName(e.target.value)} />
              <Button onClick={() => void createCostCenter()}>Kostenstelle anlegen</Button>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th>Code</th><th>Name</th><th>Status</th></tr></thead>
              <tbody>
                {costCenters.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="py-2">{c.code}</td>
                    <td>{c.name}</td>
                    <td>{c.active ? "Aktiv" : "Inaktiv"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ) : null}

      {active === "audit" ? (
        <Card>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th>Zeit</th><th>Aktion</th><th>Entity</th><th>Entity ID</th><th>IP</th></tr></thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="py-2">{new Date(a.createdAt).toISOString().replace("T", " ").slice(0, 16)}</td>
                  <td>{a.action}</td>
                  <td>{a.entityType}</td>
                  <td>{a.entityId || "-"}</td>
                  <td>{a.ipAddress || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
    </div>
  );
}
