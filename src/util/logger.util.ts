import * as console from "console";

type LoggingFunction = (message: string, ...params: any[]) => unknown;

export class NamespacedLogger {
  protected unitTest: boolean;
  private readonly namespace: string;

  public info: LoggingFunction;
  public log: LoggingFunction;
  public warn: LoggingFunction;
  public error: LoggingFunction;
  public debug: LoggingFunction;

  constructor(namespace: string) {
    this.unitTest = false;
    this.namespace = namespace;

    this.info = this.consoleLogger(console.info);
    this.log = this.consoleLogger(console.log);
    this.warn = this.consoleLogger(console.warn);
    this.error = this.consoleLogger(console.error);
    this.debug = this.consoleLogger(console.debug);
  }

  private consoleLogger(log: (...args: any[]) => void): LoggingFunction {
    return (message: string, ...params: any[]) => {
      const logPayload = [`[${this.namespace}] ${message}`, ...params];
      if (this.unitTest) {
        return logPayload;
      } else {
        log(...logPayload);
      }
    };
  }
}

export class UnitTestNamespacedLogger extends NamespacedLogger {
  constructor(namespace: string) {
    super(namespace);
    this.unitTest = true;
  }
}
