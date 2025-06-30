import UserFacingException from './UserFacingException';

export default class NotFoundException extends UserFacingException {
  constructor(message) {
    super(message, 'Not found', 404);
  }
}
