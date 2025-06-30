import UserFacingException from './UserFacingException';

export default class ValidationException extends UserFacingException {
  constructor(message) {
    super(message, 'Validation Error', 400);
  }
}
