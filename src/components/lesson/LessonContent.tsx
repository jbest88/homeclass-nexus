import ReactMarkdown from "react-markdown";

interface LessonContentProps {
  title: string;
  subject: string;
  content: string;
}

export const LessonContent = ({ title, subject, content }: LessonContentProps) => {
  return (
    <div className="mb-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <div className="inline-block bg-primary/10 px-3 py-1 rounded-full text-sm font-medium text-primary">
          {subject}
        </div>
      </div>
      <div className="prose prose-slate max-w-none dark:prose-invert">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};