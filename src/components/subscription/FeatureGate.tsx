import { ReactNode } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface FeatureGateProps {
  featureCode: string;
  children: ReactNode;
  fallback?: ReactNode;
}

const FeatureGate = ({ featureCode, children, fallback }: FeatureGateProps) => {
  const { hasAccess, isLoading } = useFeatureAccess(featureCode);

  if (isLoading) {
    return <Skeleton className="w-full h-24" />;
  }

  if (!hasAccess) {
    return fallback || (
      <Alert>
        <AlertDescription>
          This feature requires a higher subscription tier.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

export default FeatureGate;