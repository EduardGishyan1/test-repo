import UserFacingException from './UserFacingException';

export default class ServiceUnavailableException extends UserFacingException {
  constructor(message) {
    super(message, 'Service Unavailable', 503);
  }
}
