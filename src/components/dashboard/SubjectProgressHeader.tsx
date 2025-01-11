import { Progress } from "@/components/ui/progress";

interface SubjectProgressHeaderProps {
  subject: string;
  progressPercentage: number;
}

const SubjectProgressHeader = ({ subject, progressPercentage }: SubjectProgressHeaderProps) => {
  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{subject}</h3>
        <span className="text-sm text-muted-foreground">
          {Math.round(progressPercentage)}%
        </span>
      </div>
      <Progress value={progressPercentage} className="mb-4" />
    </>
  );
};

export default SubjectProgressHeader;