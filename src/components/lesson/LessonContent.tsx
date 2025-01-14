import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { cleanTitle } from "@/utils/questionUtils";

interface LessonContentProps {
  title: string;
  content: string;
}

const LessonContent = ({ title, content }: LessonContentProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4">{cleanTitle(title)}</h2>
        <ScrollArea className="h-[400px] pr-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LessonContent;