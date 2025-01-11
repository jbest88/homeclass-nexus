import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { useEffect, useRef } from "react";

interface LessonContentProps {
  title: string;
  subject: string;
  content: string;
  highlightedText?: string | null;
}

export const LessonContent = ({ title, subject, content, highlightedText }: LessonContentProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const cleanTitle = title.replace(/[*#]/g, '').trim();
  
  useEffect(() => {
    if (highlightedText && contentRef.current) {
      const contentElement = contentRef.current;
      const textNodes = Array.from(contentElement.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6'));
      
      let foundNode = null;
      for (const node of textNodes) {
        if (node.textContent?.toLowerCase().includes(highlightedText.toLowerCase())) {
          foundNode = node;
          break;
        }
      }

      if (foundNode) {
        // Remove previous highlights
        contentElement.querySelectorAll('.highlighted-content').forEach(el => {
          el.classList.remove('highlighted-content');
        });

        // Add new highlight
        foundNode.classList.add('highlighted-content');
        
        // Scroll to the highlighted section
        foundNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedText]);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{cleanTitle}</CardTitle>
        <div className="text-sm text-muted-foreground">
          Subject: {subject}
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={contentRef}
          className="prose prose-slate dark:prose-invert max-w-none
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
            [&_hr]:my-8 [&_hr]:border-muted
            [&_.highlighted-content]:bg-yellow-200/50 dark:[&_.highlighted-content]:bg-yellow-500/20 [&_.highlighted-content]:transition-colors [&_.highlighted-content]:duration-500">
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
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {format(new Date(), 'MMM d, yyyy h:mm a')}
      </CardFooter>
    </Card>
  );
};