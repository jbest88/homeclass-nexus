import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Pencil, Trash2 } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
}

interface EventListProps {
  events: Event[];
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
}

const EventList = ({ events, onEditEvent, onDeleteEvent }: EventListProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Events</h3>
      {events?.length === 0 ? (
        <p className="text-muted-foreground">No events for this day</p>
      ) : (
        events?.map((event) => (
          <div key={event.id} className="p-3 border rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CalendarCheck className="mr-2 h-4 w-4" />
                <h4 className="font-medium">{event.title}</h4>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditEvent(event)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteEvent(event.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground">
                {event.description}
              </p>
            )}
            <p className="text-sm">
              {format(new Date(event.start_time), "h:mm a")} -{" "}
              {format(new Date(event.end_time), "h:mm a")}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default EventList;