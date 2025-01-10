import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { GraduationCap, Wand2 } from "lucide-react";

interface LearningProgressProps {
  learningPlan: Array<{
    id: number;
    subject: string;
    progress: number;
    nextTopic: string;
  }>;
  isGenerating: boolean;
  selectedSubject: string;
  onGeneratePlan: (subject: string) => void;
}

const LearningProgress = ({
  learningPlan,
  isGenerating,
  selectedSubject,
  onGeneratePlan,
}: LearningProgressProps) => {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {learningPlan.map((subject) => (
            <div key={subject.id} className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{subject.subject}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onGeneratePlan(subject.subject)}
                  disabled={isGenerating && selectedSubject === subject.subject}
                >
                  {isGenerating && selectedSubject === subject.subject ? (
                    "Generating..."
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Plan
                    </>
                  )}
                </Button>
              </div>
              <Progress value={subject.progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Next topic: {subject.nextTopic}
              </p>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LearningProgress;