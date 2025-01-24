import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface CreateLessonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: string[];
  selectedSubject: string;
  onSubjectChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  gradeLevel: number | null;
}

export const CreateLessonDialog = ({
  isOpen,
  onOpenChange,
  subjects,
  selectedSubject,
  onSubjectChange,
  onGenerate,
  isGenerating,
  gradeLevel,
}: CreateLessonDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate New Lesson</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Select
              value={selectedSubject}
              onValueChange={onSubjectChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {gradeLevel !== null && (
              <p className="text-sm text-muted-foreground">
                Subjects shown are appropriate for {gradeLevel === 0 ? "Kindergarten" : `Grade ${gradeLevel}`}
              </p>
            )}
          </div>
          <Button
            onClick={onGenerate}
            disabled={isGenerating || !selectedSubject}
            className="w-full"
          >
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};