import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Assignment {
  id: number;
  title: string;
  due: string;
  subject: string;
}

interface UpcomingAssignmentsProps {
  assignments: Assignment[];
}

const UpcomingAssignments = ({ assignments }: UpcomingAssignmentsProps) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          {isMobile ? "Assignments" : "Upcoming Assignments"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                {!isMobile && <TableHead>Subject</TableHead>}
                <TableHead>Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">
                    {assignment.title}
                    {isMobile && <div className="text-xs text-muted-foreground">{assignment.subject}</div>}
                  </TableCell>
                  {!isMobile && <TableCell>{assignment.subject}</TableCell>}
                  <TableCell>{new Date(assignment.due).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingAssignments;