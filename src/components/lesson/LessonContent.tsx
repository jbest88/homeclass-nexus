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
  const cleanTitle = title.replace(/[*#]/g, '').trim();
  
  console.log('LessonContent rendered with:', {
    title: cleanTitle,
    subject,
    contentLength: content?.length,
    videosCount: videos?.length,
    videos: videos
  });

  const firstHeading = content.split('\n').find(line => line.startsWith('**') && line.endsWith('**'));
  console.log('First heading found:', firstHeading);
  
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
          prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h1:mt-8
          prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-4 prose-h2:mt-6
          prose-h3:text-xl prose-h3:font-bold prose-h3:mb-3 prose-h3:mt-5
          prose-p:text-base prose-p:leading-7 prose-p:mb-4
          prose-li:my-1 prose-li:leading-7
          prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
          prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary/20 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-6 [&_blockquote]:bg-muted/30 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg
          [&_.did-you-know]:bg-blue-500/10 [&_.did-you-know]:p-4 [&_.did-you-know]:rounded-lg [&_.did-you-know]:my-6 [&_.did-you-know]:border [&_.did-you-know]:border-blue-500/20
          [&_.summary-box]:bg-green-500/10 [&_.summary-box]:p-4 [&_.summary-box]:rounded-lg [&_.summary-box]:my-6 [&_.summary-box]:border [&_.summary-box]:border-green-500/20
          [&_hr]:my-8 [&_hr]:border-muted
          [&_strong]:text-primary [&_strong]:font-semibold
          [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse
          [&_th]:border [&_th]:border-muted [&_th]:p-3 [&_th]:bg-muted/50
          [&_td]:border [&_td]:border-muted [&_td]:p-3
          [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
          [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:my-4
          [&_img]:rounded-lg [&_img]:my-6
          [&_a]:text-primary [&_a]:underline-offset-4 [&_a]:hover:text-primary/80
          [&_section]:mb-8 [&_section]:pb-6 [&_section]:border-b [&_section]:border-muted/60 [&_section:last-child]:border-0">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => (
                <h1 className="flex items-center gap-3 text-primary" {...props} />
              ),
              h2: ({node, ...props}) => (
                <h2 className="flex items-center gap-3 text-primary/90" {...props} />
              ),
              h3: ({node, ...props}) => (
                <h3 className="flex items-center gap-3 text-primary/80" {...props} />
              ),
              p: ({ node, ...props }) => {
                const content = String(props.children);
                console.log('Processing paragraph:', content);
                
                if (content.startsWith('Did you know?')) {
                  return <div className="did-you-know" {...props} />;
                }
                
                if (content.startsWith('Summary:')) {
                  return <div className="summary-box" {...props} />;
                }
                
                if (content === firstHeading?.replace(/\*/g, '')) {
                  console.log('Found matching paragraph for first heading');
                  const video = videos?.[0];
                  console.log('Video for first heading:', video);
                  
                  return (
                    <>
                      <p {...props} />
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