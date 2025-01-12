import ReactMarkdown from "react-markdown";

interface LessonSectionProps {
  content: string;
}

export const LessonSection = ({ content }: LessonSectionProps) => {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none
      prose-headings:font-bold prose-headings:text-foreground
      prose-h1:text-3xl prose-h1:mb-8
      prose-h2:text-2xl prose-h2:mb-6
      prose-h3:text-xl prose-h3:mb-4
      prose-p:mb-4 prose-p:leading-7
      prose-li:my-2
      prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
      prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
      [&_blockquote]:border-l-4 [&_blockquote]:border-muted [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-6
      [&_.did-you-know]:bg-accent/10 [&_.did-you-know]:p-4 [&_.did-you-know]:rounded-lg [&_.did-you-know]:my-6
      [&_hr]:my-8 [&_hr]:border-muted">
      <ReactMarkdown
        components={{
          p: ({ node, ...props }) => {
            const content = String(props.children);
            if (content.startsWith('Did you know?')) {
              return <div className="did-you-know" {...props} />;
            }
            return <p {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};