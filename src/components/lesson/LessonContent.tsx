import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";

interface LessonContentProps {
  title: string;
  subject: string;
  content: string;
}

export const LessonContent = ({ title, subject, content }: LessonContentProps) => {
  // Remove markdown formatting from title (e.g., stars)
  const cleanTitle = title.replace(/[*#]/g, '').trim();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{cleanTitle}</CardTitle>
        <div className="text-sm text-muted-foreground">
          Subject: {subject}
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-slate max-w-none dark:prose-invert">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
};