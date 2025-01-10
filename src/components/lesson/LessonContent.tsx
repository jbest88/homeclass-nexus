import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LessonContentProps {
  title: string;
  subject: string;
  content: string;
}

export const LessonContent = ({ title, subject, content }: LessonContentProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="text-sm text-muted-foreground">
          Subject: {subject}
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
      </CardContent>
    </Card>
  );
};