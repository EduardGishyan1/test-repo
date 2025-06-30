import Exception from '../Exception';

export default class UserFacingException extends Exception {
  constructor(message, name, statusCode) {
    super(message, name);
    this.statusCode = statusCode;
  }

  getStatusCode() {
    return this.statusCode;
  }
}
