export default class Exception extends Error {
  constructor(message, name) {
    super(message);
    this.name = name;
  }

  getMessage() {
    return this.message;
  }

  getName() {
    return this.name;
  }
}
