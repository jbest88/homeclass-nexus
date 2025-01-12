export const isContextDependentQuestion = (questionText: string): boolean => {
  const contextPatterns = [
    /around you/i,
    /do you see/i,
    /can you see/i,
    /in your room/i,
    /in front of you/i,
    /near you/i,
    /beside you/i,
    /in your environment/i,
    /in your surroundings/i,
  ];
  return contextPatterns.some(pattern => pattern.test(questionText));
};

export const getShapeExplanation = (shape: string): string => {
  const shapeExplanations: Record<string, string> = {
    'circle': 'A circle has no sides - it is a curved line where every point is the same distance from the center.',
    'square': 'A square has 4 equal sides and 4 right angles.',
    'triangle': 'A triangle has 3 sides.',
    'rectangle': 'A rectangle has 4 sides with opposite sides being equal.',
    'pentagon': 'A pentagon has 5 sides.',
    'hexagon': 'A hexagon has 6 sides.',
    'octagon': 'An octagon has 8 sides.',
  };
  return shapeExplanations[shape.toLowerCase()] || '';
};