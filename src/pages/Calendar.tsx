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
import { CalendarPlus, CalendarCheck } from "lucide-react";
import { toast } from "sonner";

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
  });

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
      const { data, error } = await supabase.from("calendar_events").insert([
        {
          title: eventData.title,
          description: eventData.description,
          start_time: new Date(eventData.startTime).toISOString(),
          end_time: new Date(eventData.endTime).toISOString(),
        },
      ]);

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

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    addEventMutation.mutate(newEvent);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogTrigger asChild>
            <Button>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={newEvent.startTime}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={newEvent.endTime}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, endTime: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Add Event
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
                      <div className="flex items-center">
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        <h4 className="font-medium">{event.title}</h4>
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