export type LoggerLevel = 'debug' | 'info' | 'warn' | 'error'

let loggerLevel: Set<LoggerLevel> = new Set(['warn', 'error'])
if (__DEV__) {
  loggerLevel.add('debug')
}

export class LoggerStatic {
  constructor() {}

  private loggerPrefix = '[SWR]: '

  public static setLoggerLevel(level: LoggerLevel[]) {
    loggerLevel = new Set(level)
  }

  // @ts-ignore
  debug: (...args: any[]) => void
  // @ts-ignore
  info: (...args: any[]) => void
  // @ts-ignore
  warn: (...args: any[]) => void
  // @ts-ignore
  error: (...args: any[]) => void
  // @ts-ignore
  log: (...args: any[]) => void
}

const consoleLevelMap = {
  debug: console.log,
}

const prefixLevelColorMap = {
  debug: 'color: #9E9E9E',
}
;(['debug', 'info', 'warn', 'error'] as const).forEach((level) => {
  LoggerStatic.prototype[level] = function (...args: any[]) {
    if (loggerLevel.has(level)) {
      // @ts-ignore
      const hasPrefixColor = prefixLevelColorMap[level]
      // @ts-ignore
      ;(consoleLevelMap[level] || console[level])(
        // @ts-ignore

        `${hasPrefixColor ? '%c' : ''}${this.loggerPrefix}`,
        // @ts-gnore
        hasPrefixColor || '',
        ...args,
      )
    }
  }
})

LoggerStatic.prototype.log = LoggerStatic.prototype.info

export const Logger = new LoggerStatic()
