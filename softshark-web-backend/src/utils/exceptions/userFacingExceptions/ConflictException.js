import UserFacingException from './UserFacingException';

export default class ConflictException extends UserFacingException {
  constructor(message) {
    super(message, 'Resource Conflict Error', 409);
  }
}
