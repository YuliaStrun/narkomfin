export const sumAbs = (...numbers: number[]) => numbers.reduce(
  (sum, number) => sum + Math.abs(number),
  Math.abs(numbers.pop() || 0),
)