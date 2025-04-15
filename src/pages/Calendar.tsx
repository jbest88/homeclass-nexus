
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

interface InputEvent {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

export default function Calendar() {
  const [date, setDate] = useState<Date>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const user = useUser();

  const { data: events } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!user,
  });

  const filteredEvents = date
    ? events?.filter((event) => {
        const eventDate = new Date(event.start_time);
        return (
          eventDate.getFullYear() === date.getFullYear() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getDate() === date.getDate()
        );
      })
    : [];

  const handleAddEvent = async (data: Omit<CalendarEvent, "id">) => {
    if (!user) return;
    
    const { data: newEvent, error } = await supabase
      .from("calendar_events")
      .insert([
        {
          user_id: user.id,
          title: data.title,
          description: data.description,
          start_time: data.start_time,
          end_time: data.end_time,
        },
      ])
      .select()
      .single();

    if (error) {
      toast.error("Failed to add event");
      return;
    }

    setSelectedEvent(newEvent as CalendarEvent);
  };

  const handleUpdateEvent = async (eventId: string, data: Partial<InputEvent>) => {
    if (!user) return;

    const { data: updatedEvent, error } = await supabase
      .from("calendar_events")
      .update(data)
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      toast.error("Failed to update event");
      return;
    }

    setSelectedEvent(updatedEvent as CalendarEvent);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      toast.error("Failed to delete event");
      return;
    }

    setSelectedEvent(null);
    toast.success("Event deleted successfully");
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-4 p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Calendar</CardTitle>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="grid gap-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {date && (
            <div className="rounded-md border p-4">
              <h4 className="mb-2 font-medium">
                Events for {format(date, "PPP")}
              </h4>
              {filteredEvents && filteredEvents.length > 0 ? (
                <ul className="list-none pl-0">
                  {filteredEvents.map((event) => (
                    <li
                      key={event.id}
                      className="mb-2 flex items-center justify-between"
                    >
                      <span>{event.title}</span>
                      <div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                        >
                          View
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No events for this date.
                </p>
              )}
              <Button onClick={() => setSelectedEvent({
                id: 'new',
                title: '',
                description: '',
                start_time: date.toISOString(),
                end_time: date.toISOString(),
              })} variant="secondary">Add Event</Button>
            </div>
          )}
        </CardContent>
      </Card>
      {selectedEvent && (
        <EventDialog
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onAdd={handleAddEvent}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
}

interface EventDialogProps {
  event: CalendarEvent;
  onClose: () => void;
  onAdd: (data: Omit<CalendarEvent, "id">) => Promise<void>;
  onUpdate: (eventId: string, data: Partial<InputEvent>) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
}

function EventDialog({ event, onClose, onAdd, onUpdate, onDelete }: EventDialogProps) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [startTime, setStartTime] = useState(event.start_time);
  const [endTime, setEndTime] = useState(event.end_time);

  const isNewEvent = event.id === 'new';

  const handleSubmit = async () => {
    const data = {
      title,
      description,
      start_time: startTime,
      end_time: endTime,
    };

    if (isNewEvent) {
      await onAdd(data);
    } else {
      await onUpdate(event.id, data);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!isNewEvent) {
      await onDelete(event.id);
    }
    onClose();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isNewEvent ? "Add Event" : "View Event"}</CardTitle>
        <CardDescription>
          {isNewEvent ? "Create a new event." : "Update or delete event."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            type="datetime-local"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            type="datetime-local"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </CardContent>
      <div className="flex justify-between p-4">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <div>
          {!isNewEvent && (
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button onClick={handleSubmit}>{isNewEvent ? "Add" : "Update"}</Button>
        </div>
      </div>
    </Card>
  );
}

const cn = (...inputs: (string | undefined | null)[]): string => {
  return inputs.filter(Boolean).join(' ');
}
