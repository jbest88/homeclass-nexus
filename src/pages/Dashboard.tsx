import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, BookOpen, GraduationCap } from "lucide-react";

const Dashboard = () => {
  // Mock data - in a real app, this would come from your backend
  const learningPlan = [
    { id: 1, subject: "Mathematics", progress: 75, nextTopic: "Calculus" },
    { id: 2, subject: "Physics", progress: 60, nextTopic: "Mechanics" },
    { id: 3, subject: "Chemistry", progress: 45, nextTopic: "Organic Chemistry" },
  ];

  const upcomingAssignments = [
    { id: 1, title: "Math Quiz", due: "2024-03-20", subject: "Mathematics" },
    { id: 2, title: "Physics Lab Report", due: "2024-03-22", subject: "Physics" },
    { id: 3, title: "Chemistry Homework", due: "2024-03-25", subject: "Chemistry" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary mb-8">Learning Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Learning Progress Card */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {learningPlan.map((subject) => (
                <div key={subject.id} className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{subject.subject}</span>
                    <span className="text-muted-foreground">{subject.progress}%</span>
                  </div>
                  <Progress value={subject.progress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Next topic: {subject.nextTopic}
                  </p>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Study Stats Card */}
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

        {/* Upcoming Assignments */}
        <Card className="col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Upcoming Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>{assignment.subject}</TableCell>
                    <TableCell>{new Date(assignment.due).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;