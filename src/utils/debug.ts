import { Colors } from './colors';

const log = (message: string, color: Colors = null) => {
  if (
    process.env.DEBUG === 'ro.rqb:debug' &&
    typeof console !== 'undefined' &&
    typeof console.log === 'function'
  ) {
    console.log(color, message);
  }
};

export class Debug {
  static log(message: string) {
    log(message);
  }
  static warn(message: string) {
    log(message, Colors.YELLOW);
  }
  static error(message: string) {
    log(message, Colors.RED);
  }
  static success(message: string) {
    log(message, Colors.GREEN);
  }
}
