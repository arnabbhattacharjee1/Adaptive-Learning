import { z } from 'zod';
import { Logger } from './logger.js';

/**
 * Startup Environment Variable Schema
 * Ensures container fails fast if missing required GCP variables.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3001').transform((val) => parseInt(val, 10)),
  GCP_PROJECT_ID: z.string().default('adaptive-learning-506305'),
  GCP_REGION: z.string().default('us-central1'),
  JWT_SECRET: z.string().default('alis-jwt-super-secret-key-2026'),
  PUBSUB_TOPIC_TELEMETRY: z.string().default('alis-telemetry-events'),
  GOOGLE_CLIENT_ID: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates environment variables on server boot up.
 */
export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    Logger.error('❌ Environment Variable Validation Failed on Startup', result.error.format());
    throw new Error('Fatal Configuration Error: Invalid environment variables.');
  }

  Logger.info('✅ Environment configuration validated successfully.', {
    nodeEnv: result.data.NODE_ENV,
    port: result.data.PORT,
    gcpProject: result.data.GCP_PROJECT_ID,
    gcpRegion: result.data.GCP_REGION,
  });

  return result.data;
}
