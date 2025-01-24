import { Alert, AlertDescription } from "@/components/ui/alert";
import LearningProgress from "./LearningProgress";
import StudyStats from "./StudyStats";
import UpcomingAssignments from "./UpcomingAssignments";
import FeatureGate from "@/components/subscription/FeatureGate";

interface DashboardContentProps {
  isGenerating: boolean;
  upcomingAssignments: Array<{
    id: number;
    title: string;
    due: string;
    subject: string;
  }>;
}

export const DashboardContent = ({
  isGenerating,
  upcomingAssignments,
}: DashboardContentProps) => {
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <FeatureGate 
          featureCode="learning_paths"
          fallback={
            <Alert>
              <AlertDescription>
                Learning paths are available with a subscription. Upgrade to access this feature!
              </AlertDescription>
            </Alert>
          }
        >
          <LearningProgress isGenerating={isGenerating} />
        </FeatureGate>
      </div>
      <div className="space-y-4">
        <FeatureGate 
          featureCode="progress_analytics"
          fallback={
            <Alert>
              <AlertDescription>
                Detailed analytics are available with a Basic or higher subscription.
              </AlertDescription>
            </Alert>
          }
        >
          <StudyStats />
        </FeatureGate>
        <UpcomingAssignments assignments={upcomingAssignments} />
      </div>
    </div>
  );
};