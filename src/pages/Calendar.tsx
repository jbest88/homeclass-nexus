import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { useSession } from "@supabase/auth-helpers-react";
import EventDialog from "@/components/calendar/EventDialog";
import EventList from "@/components/calendar/EventList";
import LessonList from "@/components/calendar/LessonList";

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<null | {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
  }>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
  });

  const session = useSession();
  const queryClient = useQueryClient();

  // Fetch events for the selected date
  const { data: events, isLoading } = useQuery({
    queryKey: ["events", date ? format(date, "yyyy-MM-dd") : null],
    queryFn: async () => {
      if (!date) return [];
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString())
        .order("start_time");

      if (error) throw error;
      return data;
    },
    enabled: !!date,
  });

  // Fetch lessons for the selected date
  const { data: lessons } = useQuery({
    queryKey: ["lessons", date ? format(date, "yyyy-MM-dd") : null],
    queryFn: async () => {
      if (!date) return [];
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("generated_lessons")
        .select("*")
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString())
        .order("created_at");

      if (error) throw error;
      return data;
    },
    enabled: !!date,
  });

  const addEventMutation = useMutation({
    mutationFn: async (eventData: typeof newEvent) => {
      if (!session?.user?.id || !date) {
        throw new Error("User must be logged in and date must be selected to add events");
      }

      const startDate = new Date(date);
      const [startHours, startMinutes] = eventData.startTime.split(':');
      startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

      const endDate = new Date(date);
      const [endHours, endMinutes] = eventData.endTime.split(':');
      endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

      const { data, error } = await supabase.from("calendar_events").insert([{
        title: eventData.title,
        description: eventData.description,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        user_id: session.user.id
      }]);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsAddEventOpen(false);
      setNewEvent({ title: "", description: "", startTime: "", endTime: "" });
      toast.success("Event added successfully");
    },
    onError: (error) => {
      console.error("Error adding event:", error);
      toast.error("Failed to add event");
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (eventData: typeof editingEvent) => {
      if (!eventData) return;
      
      const startDate = new Date(date!);
      const [startHours, startMinutes] = eventData.startTime.split(':');
      startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

      const endDate = new Date(date!);
      const [endHours, endMinutes] = eventData.endTime.split(':');
      endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

      const { error } = await supabase
        .from("calendar_events")
        .update({
          title: eventData.title,
          description: eventData.description,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
        })
        .eq("id", eventData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsAddEventOpen(false);
      setEditingEvent(null);
      toast.success("Event updated successfully");
    },
    onError: (error) => {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    },
  });

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      updateEventMutation.mutate(editingEvent);
    } else {
      addEventMutation.mutate(newEvent);
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent({
      id: event.id,
      title: event.title,
      description: event.description || "",
      startTime: format(new Date(event.start_time), "HH:mm"),
      endTime: format(new Date(event.end_time), "HH:mm"),
    });
    setIsAddEventOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate(eventId);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <EventDialog
          isOpen={isAddEventOpen}
          onOpenChange={(open) => {
            setIsAddEventOpen(open);
            if (!open) setEditingEvent(null);
          }}
          editingEvent={editingEvent}
          onSubmit={handleAddEvent}
          onEventDataChange={editingEvent ? setEditingEvent : setNewEvent}
          eventData={editingEvent || newEvent}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Events for {date ? format(date, "MMMM d, yyyy") : "Select a date"}
          </h2>
          
          {isLoading ? (
            <div>Loading events...</div>
          ) : (
            <>
              <EventList
                events={events || []}
                onEditEvent={handleEditEvent}
                onDeleteEvent={handleDeleteEvent}
              />
              <LessonList lessons={lessons || []} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;