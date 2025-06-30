import Exception from '../Exception';
import { ValidationException } from '../userFacingExceptions';

/**
 * Parses a joi exception and returns a UserFacingException.
 * Returns back the exception as is, if not passed a joi exception as an argument.
 * @param {Object} error
 * @param {string} message
 */
function parseJoiException(error, message) {
  if (!error?.isJoi) {
    throw new Exception('No joi exception passed as an argument');
  }
  const joiMessages = error.details.map((detail) => detail.message);
  const errorMessage = `${(message || 'Validation error')}:  ${joiMessages.join('; ')}`;
  return new ValidationException(errorMessage);
}

export default parseJoiException;
