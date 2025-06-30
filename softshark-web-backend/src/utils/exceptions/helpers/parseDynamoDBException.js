import pino from 'pino';
import {
  ValidationException,
  NotFoundException,
  ServiceUnavailableException,
  InsufficientStorageException,
  BadRequestException,
} from '../userFacingExceptions';
// logger
const logger = pino({
  name: 'parseDynamoDBException',
});

/**
 * Parses a dynamodb exception and returns a corresponding UserFacingException.
 * Returns back the exception as is, if not passed a dynamodb exception as an argument
 * or the exception does not correspond to any UserFacingException alternative.
 * @param {Object} error
 * @param {string} message
 */
function parseDynamoDBException(error, message) {
  logger.error(error);
  switch (error.name) {
    case 'AccessDeniedException':
      return error;
    case 'ConditionalCheckFailedException':
      return new BadRequestException(message);
    case 'IncompleteSignatureException':
      return error;
    case 'ItemCollectionSizeLimitExceededException':
      return new InsufficientStorageException(message);
    case 'LimitExceededException':
      return new ServiceUnavailableException(message);
    case 'MissingAuthenticationTokenException':
      return error;
    case 'ProvisionedThroughputExceededException':
      return new ServiceUnavailableException(message);
    case 'RequestLimitExceeded':
      return new ServiceUnavailableException(message);
    case 'ResourceInUseException':
      return new ServiceUnavailableException(message);
    case 'ResourceNotFoundException':
      return new NotFoundException(message);
    case 'ThrottlingException':
      return new ServiceUnavailableException(message);
    case 'UnrecognizedClientException':
      return error;
    case 'ValidationException':
      return new ValidationException(message);
    default:
      return error;
  }
}

export default parseDynamoDBException;
