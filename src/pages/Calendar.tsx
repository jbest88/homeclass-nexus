import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CalendarPlus, CalendarCheck, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@supabase/auth-helpers-react";

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<null | { id: string; title: string; description: string; startTime: string; endTime: string }>(null);
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
        <Dialog open={isAddEventOpen} onOpenChange={(open) => {
          setIsAddEventOpen(open);
          if (!open) setEditingEvent(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingEvent?.title || newEvent.title}
                  onChange={(e) =>
                    editingEvent
                      ? setEditingEvent({ ...editingEvent, title: e.target.value })
                      : setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingEvent?.description || newEvent.description}
                  onChange={(e) =>
                    editingEvent
                      ? setEditingEvent({ ...editingEvent, description: e.target.value })
                      : setNewEvent({ ...newEvent, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={editingEvent?.startTime || newEvent.startTime}
                  onChange={(e) =>
                    editingEvent
                      ? setEditingEvent({ ...editingEvent, startTime: e.target.value })
                      : setNewEvent({ ...newEvent, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={editingEvent?.endTime || newEvent.endTime}
                  onChange={(e) =>
                    editingEvent
                      ? setEditingEvent({ ...editingEvent, endTime: e.target.value })
                      : setNewEvent({ ...newEvent, endTime: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingEvent ? "Update Event" : "Add Event"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Events</h3>
                {events?.length === 0 ? (
                  <p className="text-muted-foreground">No events for this day</p>
                ) : (
                  events?.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 border rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CalendarCheck className="mr-2 h-4 w-4" />
                          <h4 className="font-medium">{event.title}</h4>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditEvent(event)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEvent(event.id)}
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

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Lessons</h3>
                {lessons?.length === 0 ? (
                  <p className="text-muted-foreground">No lessons for this day</p>
                ) : (
                  lessons?.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="p-3 border rounded-lg space-y-1"
                    >
                      <h4 className="font-medium">{lesson.title}</h4>
                      <p className="text-sm">Subject: {lesson.subject}</p>
                      <p className="text-sm">
                        Created: {format(new Date(lesson.created_at), "h:mm a")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;