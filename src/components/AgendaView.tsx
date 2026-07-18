import { getAgenda, getAgendaFiles } from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import AgendaBoard from "@/components/AgendaBoard";
import LiveRefresh from "@/components/LiveRefresh";

export default async function AgendaView() {
  const [items, files, admin] = await Promise.all([
    getAgenda(),
    getAgendaFiles(),
    getAdminUser(),
  ]);
  // Non-admins get live updates; skip for admins so an open editor isn't
  // disrupted while they're making changes.
  const isAdmin = Boolean(admin);
  return (
    <>
      {!isAdmin && <LiveRefresh />}
      <AgendaBoard items={items} files={files} isAdmin={isAdmin} />
    </>
  );
}
