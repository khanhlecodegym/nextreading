// Rating system on Book saving by array of totalRating count
// Detail: https://stackoverflow.com/a/64807037/5456204

export const calcNewRating = (
  currentRating: number[],
  value: number,
  change: number, // -1 or +1
) => {
  // Nothing change: Not rating yet
  if (!value) {
    return currentRating;
  }

  const newRating = [...currentRating];
  newRating[value - 1] = newRating[value - 1] + change;

  return newRating;
};
