export class SWRError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SWRError'
  }
}
