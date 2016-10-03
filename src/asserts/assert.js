/**
 * Checks for a condition; if the condition is false,
 * follows the escalation policy set for the analyzer.
 * @param {string} message - A message to display if the condition is not met.
 * @param {boolean} condition - The condition to check.
 * @param {Error} customError - The custom error class to be thrown.
 */
export default function assert(message, condition, CustomError = Error) {
  if (!condition) {
    throw new CustomError(message);
  }
}
