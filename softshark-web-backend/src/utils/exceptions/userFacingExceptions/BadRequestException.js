import UserFacingException from './UserFacingException';

export default class BadRequestException extends UserFacingException {
  constructor(message) {
    super(message, 'Bad Request', 400);
  }
}
