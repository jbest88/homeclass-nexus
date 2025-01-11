import { LearningPath } from "@/types/learning-path";
import { format } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { LearningPathItem } from "./LearningPathItem";
import { useState } from "react";

interface LearningPathsListProps {
  learningPaths: LearningPath[];
  onDelete: (lessonId: string) => void;
  isGenerating: boolean;
  cleanTitle: (title: string) => string;
}

const LearningPathsList = ({ 
  learningPaths,
  onDelete,
  isGenerating,
  cleanTitle
}: LearningPathsListProps) => {
  const [openPaths, setOpenPaths] = useState<Record<string, boolean>>({});

  const togglePath = (pathId: string) => {
    setOpenPaths(prev => ({
      ...prev,
      [pathId]: !prev[pathId]
    }));
  };

  return (
    <>
      {learningPaths.map((path) => (
        <Collapsible
          key={path.id}
          open={openPaths[path.id]}
          onOpenChange={() => togglePath(path.id)}
          className="mb-4"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-2 hover:bg-accent">
            <span className="font-medium">
              Learning Path - {format(new Date(path.created_at), 'MMM d, yyyy')}
            </span>
            {openPaths[path.id] ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {path.lessons?.map((lesson) => (
              <LearningPathItem
                key={lesson.id}
                lessonId={lesson.lesson_id}
                title={cleanTitle(lesson.title)}
                createdAt={lesson.created_at}
                onDelete={onDelete}
                isGenerating={isGenerating}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </>
  );
};

export default LearningPathsList;