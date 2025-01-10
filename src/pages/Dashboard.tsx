import { Button, Container, Row, Col, Modal, Form } from 'react-bootstrap';
import { LogOut, Plus, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import LearningProgress from "@/components/dashboard/LearningProgress";
import StudyStats from "@/components/dashboard/StudyStats";
import UpcomingAssignments from "@/components/dashboard/UpcomingAssignments";
import { useGenerateLesson } from "@/hooks/useGenerateLesson";
import { getSubjectsForGrade } from "@/utils/gradeSubjects";
import ProfileSettings from "@/components/profile/ProfileSettings";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isGenerating, handleGenerateLesson } = useGenerateLesson();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("profiles")
        .select("grade_level")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const subjects = getSubjectsForGrade(profile?.grade_level);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error logging out');
    }
  };

  const handleGenerate = async () => {
    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }
    await handleGenerateLesson(selectedSubject);
    setShowGenerateDialog(false);
    setSelectedSubject("");
  };

  const upcomingAssignments = [
    { id: 1, title: "Math Quiz", due: "2024-03-20", subject: "Mathematics" },
    { id: 2, title: "Physics Lab Report", due: "2024-03-22", subject: "Physics" },
    { id: 3, title: "Chemistry Homework", due: "2024-03-25", subject: "Chemistry" },
  ];

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 text-primary">Learning Dashboard</h1>
        <div className="d-flex gap-3">
          <Button variant="primary" onClick={() => setShowGenerateDialog(true)}>
            <Plus className="me-2" size={16} />
            Generate Lesson
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowProfileDialog(true)}>
            <Settings className="me-2" size={16} />
            Profile Settings
          </Button>
          <Button variant="outline-secondary" onClick={handleLogout}>
            <LogOut className="me-2" size={16} />
            Logout
          </Button>
        </div>
      </div>
      
      <Row className="g-4">
        <Col md={6} lg={8}>
          <LearningProgress isGenerating={isGenerating} />
        </Col>
        <Col md={6} lg={4}>
          <StudyStats />
        </Col>
        <Col xs={12}>
          <UpcomingAssignments assignments={upcomingAssignments} />
        </Col>
      </Row>

      {/* Generate Lesson Modal */}
      <Modal show={showGenerateDialog} onHide={() => setShowGenerateDialog(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Generate New Lesson</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={isGenerating || !selectedSubject}
          >
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Profile Settings Modal */}
      <Modal show={showProfileDialog} onHide={() => setShowProfileDialog(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Profile Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ProfileSettings />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Dashboard;