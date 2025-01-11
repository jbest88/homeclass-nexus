import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

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
        <div className="prose prose-slate max-w-none dark:prose-invert [&>h1]:mb-8 [&>h2]:mb-6 [&>h3]:mb-4">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {format(new Date(), 'MMM d, yyyy h:mm a')}
      </CardFooter>
    </Card>
  );
};