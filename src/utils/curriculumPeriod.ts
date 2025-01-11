export const getCurriculumPeriod = (date: string) => {
  const lessonDate = new Date(date);
  const month = lessonDate.getMonth();
  
  if (month >= 8 && month <= 10) return "Fall Semester";
  if (month >= 11 || month <= 1) return "Winter Term";
  if (month >= 2 && month <= 4) return "Spring Semester";
  return "Summer Term";
};