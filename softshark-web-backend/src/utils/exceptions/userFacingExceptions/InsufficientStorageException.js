import UserFacingException from './UserFacingException';

export default class InsufficientStorageException extends UserFacingException {
  constructor(message) {
    super(message, 'Service Unavailable', 507);
  }
}
