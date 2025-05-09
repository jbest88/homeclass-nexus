
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGenerateLesson } from "@/hooks/useGenerateLesson";

interface CreateLessonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: string[];
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  onGenerate: (isPlacementTest: boolean) => Promise<void>;
  isGenerating: boolean;
  gradeLevel: number | null;
}

export const CreateLessonDialog: React.FC<CreateLessonDialogProps> = ({
  isOpen,
  onOpenChange,
  subjects,
  selectedSubject,
  onSubjectChange,
  onGenerate,
  isGenerating,
  gradeLevel,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Lesson</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Subject
            </label>
            <Select value={selectedSubject} onValueChange={onSubjectChange}>
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
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="default"
            onClick={() => onGenerate(false)}
            disabled={isGenerating || !selectedSubject}
            className="w-full sm:w-auto"
          >
            {isGenerating ? "Generating..." : "Generate Lesson"}
          </Button>
          <Button
            variant="outline"
            onClick={() => onGenerate(true)}
            disabled={isGenerating || !selectedSubject}
            className="w-full sm:w-auto"
          >
            {isGenerating ? "Generating..." : "Create Placement Test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
