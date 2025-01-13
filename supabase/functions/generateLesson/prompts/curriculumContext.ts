type CurriculumContext = {
  currentTopics: string;
  previousKnowledge: string;
  upcomingTopics: string;
};

export const getCurriculumContext = (curriculumPeriod: string): CurriculumContext => {
  switch (curriculumPeriod) {
    case "Early Fall":
      return {
        currentTopics: "foundational concepts and introductory principles",
        previousKnowledge: "review of previous grade level concepts",
        upcomingTopics: "building blocks for core subject concepts"
      };
    case "Mid Fall":
      return {
        currentTopics: "core concept development and key principles",
        previousKnowledge: "foundational concepts from early fall",
        upcomingTopics: "advanced applications and complex problem-solving"
      };
    case "Late Fall":
      return {
        currentTopics: "advanced applications and concept integration",
        previousKnowledge: "core concepts and fundamental principles",
        upcomingTopics: "comprehensive understanding and synthesis"
      };
    case "Winter":
      return {
        currentTopics: "concept synthesis and cross-topic integration",
        previousKnowledge: "first semester core concepts",
        upcomingTopics: "new concept foundations for spring semester"
      };
    case "Early Spring":
      return {
        currentTopics: "new concept foundations and principles",
        previousKnowledge: "first semester mastery topics",
        upcomingTopics: "advanced spring concepts and applications"
      };
    case "Mid Spring":
      return {
        currentTopics: "advanced concept development and applications",
        previousKnowledge: "early spring foundations",
        upcomingTopics: "mastery-level content and integration"
      };
    case "Late Spring":
      return {
        currentTopics: "mastery-level content and comprehensive integration",
        previousKnowledge: "full year concept progression",
        upcomingTopics: "year-end synthesis and advanced applications"
      };
    case "Summer":
      return {
        currentTopics: "enrichment and advanced applications",
        previousKnowledge: "comprehensive year review",
        upcomingTopics: "preparation for next grade level concepts"
      };
    default:
      return {
        currentTopics: "grade-appropriate concepts",
        previousKnowledge: "prerequisite concepts for current topics",
        upcomingTopics: "next sequential learning objectives"
      };
  }
};