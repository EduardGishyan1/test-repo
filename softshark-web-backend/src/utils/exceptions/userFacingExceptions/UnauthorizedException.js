import UserFacingException from './UserFacingException';

export default class UnauthorizedException extends UserFacingException {
  constructor(message) {
    super(message, 'Unauthorized', 401);
  }
}
