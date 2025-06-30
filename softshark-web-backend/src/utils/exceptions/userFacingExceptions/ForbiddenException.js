import UserFacingException from './UserFacingException';

export default class ForbiddenException extends UserFacingException {
  constructor(message) {
    super(message, 'Forbidden', 403);
  }
}
