import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { Video } from "@/types/video";

interface LessonContentProps {
  title: string;
  subject: string;
  content: string;
  videos?: Video[];
}

export const LessonContent = ({ title, subject, content, videos }: LessonContentProps) => {
  // Remove markdown formatting from title (e.g., stars)
  const cleanTitle = title.replace(/[*#]/g, '').trim();
  
  console.log('LessonContent rendered with:', {
    title: cleanTitle,
    subject,
    contentLength: content?.length,
    videosCount: videos?.length,
    videos: videos
  });
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{cleanTitle}</CardTitle>
        <div className="text-sm text-muted-foreground">
          Subject: {subject}
        </div>
      </CardHeader>
      <CardContent>
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
              // Custom component for "Did you know?" sections
              p: ({ node, ...props }) => {
                const content = String(props.children);
                if (content.startsWith('Did you know?')) {
                  return <div className="did-you-know" {...props} />;
                }
                return <p {...props} />;
              },
              // Add video embed after first heading only
              h2: ({ node, ...props }) => {
                const headingContent = String(props.children);
                console.log('Processing h2:', headingContent);
                const video = videos?.[0]; // Only use first video
                console.log('Video for heading:', video);
                return (
                  <>
                    <h2 {...props} />
                    {video && (
                      <div className="my-6">
                        <div className="aspect-w-16 aspect-h-9">
                          <iframe
                            src={`https://www.youtube.com/embed/${video.videoId}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full rounded-lg"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {video.title}
                        </p>
                      </div>
                    )}
                  </>
                );
              },
              // Remove video embedding from h3
              h3: ({ node, ...props }) => <h3 {...props} />,
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