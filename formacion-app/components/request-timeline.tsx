import { formatDate, STATUS_LABELS } from "@/lib/labels";
import type { RequestEvent } from "@/lib/types";

export function RequestTimeline({ events }: { events: RequestEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin movimientos todavía.</p>;
  }

  return (
    <ol className="space-y-4 border-l pl-4">
      {events.map((event) => (
        <li key={event.id} className="-ml-px">
          <p className="text-sm font-medium break-words">
            {event.from_status
              ? `${STATUS_LABELS[event.from_status]} → ${event.to_status ? STATUS_LABELS[event.to_status] : ""}`
              : event.to_status
                ? STATUS_LABELS[event.to_status]
                : "Evento"}
          </p>
          <p className="text-xs text-muted-foreground">
            {event.actor?.full_name ?? "Sistema"} · {formatDate(event.created_at)}
          </p>
          {event.comment ? (
            <p className="mt-1 text-sm break-words text-muted-foreground">{event.comment}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
