import { format } from "date-fns";

interface Lesson {
  id: string;
  title: string;
  subject: string;
  created_at: string;
}

interface LessonListProps {
  lessons: Lesson[];
}

const LessonList = ({ lessons }: LessonListProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Lessons</h3>
      {lessons?.length === 0 ? (
        <p className="text-muted-foreground">No lessons for this day</p>
      ) : (
        lessons?.map((lesson) => (
          <div key={lesson.id} className="p-3 border rounded-lg space-y-1">
            <h4 className="font-medium">{lesson.title}</h4>
            <p className="text-sm">Subject: {lesson.subject}</p>
            <p className="text-sm">
              Created: {format(new Date(lesson.created_at), "h:mm a")}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default LessonList;