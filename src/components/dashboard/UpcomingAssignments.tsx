import { Card, Table } from 'react-bootstrap';
import { CalendarDays } from "lucide-react";

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
  return (
    <Card>
      <Card.Header>
        <div className="d-flex align-items-center gap-2">
          <CalendarDays size={20} />
          <Card.Title className="mb-0">Upcoming Assignments</Card.Title>
        </div>
      </Card.Header>
      <Card.Body>
        <Table responsive>
          <thead>
            <tr>
              <th>Assignment</th>
              <th>Subject</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>{assignment.title}</td>
                <td>{assignment.subject}</td>
                <td>{new Date(assignment.due).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default UpcomingAssignments;