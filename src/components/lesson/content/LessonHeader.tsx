import { CardHeader, CardTitle } from "@/components/ui/card";

interface LessonHeaderProps {
  title: string;
  subject: string;
}

export const LessonHeader = ({ title, subject }: LessonHeaderProps) => {
  const cleanTitle = title.replace(/[*#]/g, '').trim();
  
  return (
    <CardHeader>
      <CardTitle className="text-2xl font-bold">{cleanTitle}</CardTitle>
      <div className="text-sm text-muted-foreground">
        Subject: {subject}
      </div>
    </CardHeader>
  );
};