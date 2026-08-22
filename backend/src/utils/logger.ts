/**
 * Structured GCP Cloud Logger
 * Formats log entries as JSON objects matching Google Cloud Logging specs.
 */

export interface LogPayload {
  message: string;
  [key: string]: any;
}

export class Logger {
  private static format(severity: string, message: string, meta: Record<string, any> = {}) {
    return JSON.stringify({
      severity,
      message,
      timestamp: new Date().toISOString(),
      serviceContext: {
        service: 'alis-backend',
        version: process.env.K_REVISION || '1.0.0',
      },
      ...meta,
    });
  }

  static info(message: string, meta?: Record<string, any>) {
    console.log(this.format('INFO', message, meta));
  }

  static warn(message: string, meta?: Record<string, any>) {
    console.warn(this.format('WARNING', message, meta));
  }

  static error(message: string, error?: any, meta: Record<string, any> = {}) {
    const errorDetails = error instanceof Error ? {
      errorMessage: error.message,
      stack: error.stack,
    } : { rawError: error };

    console.error(this.format('ERROR', message, { ...errorDetails, ...meta }));
  }
}
