type CurriculumContext = {
  currentTopics: string;
  previousKnowledge: string;
  upcomingTopics: string;
};

export const getCurriculumContext = (curriculumPeriod: string): CurriculumContext => {
  switch (curriculumPeriod) {
    case "Fall Semester":
      return {
        currentTopics: "foundational concepts and essential building blocks",
        previousKnowledge: "basic prerequisites and fundamental concepts",
        upcomingTopics: "intermediate applications and expanding core concepts"
      };
    case "Winter Term":
      return {
        currentTopics: "intermediate concepts and practical applications",
        previousKnowledge: "foundational concepts and basic principles",
        upcomingTopics: "advanced topics and complex problem-solving"
      };
    case "Spring Semester":
      return {
        currentTopics: "advanced applications and concept integration",
        previousKnowledge: "foundational and intermediate concepts",
        upcomingTopics: "comprehensive mastery and higher-level thinking"
      };
    case "Summer Term":
      return {
        currentTopics: "synthesis and mastery of key concepts",
        previousKnowledge: "comprehensive understanding of core principles",
        upcomingTopics: "preparation for next level concepts"
      };
    default:
      return {
        currentTopics: "grade-appropriate concepts",
        previousKnowledge: "prerequisite concepts for this grade level",
        upcomingTopics: "upcoming grade-level material"
      };
  }
};