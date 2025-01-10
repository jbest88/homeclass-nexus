export const getSubjectsForGrade = (grade: number | null): string[] => {
  // Default subjects for when grade is not set
  if (grade === null) {
    return ["Mathematics", "Science", "English", "Social Studies"];
  }

  // Kindergarten (grade 0)
  if (grade === 0) {
    return [
      "Basic Mathematics",
      "Reading & Writing",
      "Science Discovery",
      "Social Skills"
    ];
  }

  // Grades 1-5 (Elementary)
  if (grade <= 5) {
    return [
      "Mathematics",
      "Reading & Writing",
      "Science",
      "Social Studies",
      "Art & Music"
    ];
  }

  // Grades 6-8 (Middle School)
  if (grade <= 8) {
    return [
      "Mathematics",
      "Language Arts",
      "Life Science",
      "Earth Science",
      "Physical Science",
      "World History",
      "Geography"
    ];
  }

  // Grades 9-12 (High School)
  return [
    "Algebra",
    "Geometry",
    "Biology",
    "Chemistry",
    "Physics",
    "World History",
    "Literature",
    "Computer Science"
  ];
};