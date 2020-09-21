export default class CompilerError extends Error {
  constructor(message: string) {
    super(`[Compiler Error]: ${message}`);
    this.name = 'CompilerError';
  }
}
