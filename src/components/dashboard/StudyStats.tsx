import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const StudyStats = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Study Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Completed Topics</span>
            <span className="text-2xl font-bold">12</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Hours Studied</span>
            <span className="text-2xl font-bold">24</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Assignments Done</span>
            <span className="text-2xl font-bold">8</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyStats;