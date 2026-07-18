import { getAgenda, getAgendaFiles, getCoffeeOrdersForAttendee } from "@/lib/data";
import { getAdminUser } from "@/lib/auth";
import { getCurrentAttendee } from "@/lib/attendee";
import AgendaBoard from "@/components/AgendaBoard";

export default async function AgendaView() {
  const [items, files, admin, me] = await Promise.all([
    getAgenda(),
    getAgendaFiles(),
    getAdminUser(),
    getCurrentAttendee(),
  ]);
  // Members can order coffee on the Coffee & Breakfast cards; load their orders.
  const myCoffee = me ? await getCoffeeOrdersForAttendee(me.id) : [];
  // Live refresh is handled once in the root layout (non-admins).
  return (
    <AgendaBoard
      items={items}
      files={files}
      isAdmin={Boolean(admin)}
      canOrderCoffee={Boolean(me)}
      myCoffee={myCoffee}
    />
  );
}
