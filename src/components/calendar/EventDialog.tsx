import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarPlus } from "lucide-react";

interface EventDialogProps {
  eventData: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
  };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
  } | null;
  onSubmit: (e: React.FormEvent) => void;  
  onEventDataChange: (data: EventDialogProps["eventData"]) => void;
}

const EventDialog = ({
  isOpen,
  onOpenChange,
  editingEvent,
  onSubmit,
  onEventDataChange,
  eventData,
}: EventDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={eventData.title}
              onChange={(e) =>
                onEventDataChange({ ...eventData, title: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={eventData.description}
              onChange={(e) =>
                onEventDataChange({ ...eventData, description: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={eventData.startTime}
              onChange={(e) =>
                onEventDataChange({ ...eventData, startTime: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="time"
              value={eventData.endTime}
              onChange={(e) =>
                onEventDataChange({ ...eventData, endTime: e.target.value })
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
  );
};

export default EventDialog;