export const getCurriculumPeriod = (date: string) => {
  const lessonDate = new Date(date);
  const month = lessonDate.getMonth();
  const day = lessonDate.getDate();
  
  // Early Fall (August-September): Introduction of new concepts
  if (month === 7 || (month === 8 && day <= 30)) {
    return "Early Fall";
  }
  // Mid Fall (October): Core concept development
  if (month === 9) {
    return "Mid Fall";
  }
  // Late Fall (November-December): Advanced applications
  if (month === 10 || (month === 11 && day <= 15)) {
    return "Late Fall";
  }
  // Winter (December-January): Review and integration
  if ((month === 11 && day > 15) || (month === 0 && day <= 15)) {
    return "Winter";
  }
  // Early Spring (January-February): New concept introduction
  if ((month === 0 && day > 15) || (month === 1)) {
    return "Early Spring";
  }
  // Mid Spring (March): Core development
  if (month === 2) {
    return "Mid Spring";
  }
  // Late Spring (April-May): Mastery and integration
  if (month === 3 || (month === 4 && day <= 15)) {
    return "Late Spring";
  }
  // Summer (May-July): Enrichment and preparation
  return "Summer";
};