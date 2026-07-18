import { getAgenda, getAgendaFiles } from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import AgendaBoard from "@/components/AgendaBoard";

export default async function AgendaView() {
  const [items, files, admin] = await Promise.all([
    getAgenda(),
    getAgendaFiles(),
    getAdminUser(),
  ]);
  // Live refresh is handled once in the root layout (non-admins).
  return <AgendaBoard items={items} files={files} isAdmin={Boolean(admin)} />;
}
