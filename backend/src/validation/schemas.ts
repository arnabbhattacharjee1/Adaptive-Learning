import { z } from 'zod';

export const TelemetrySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  nodeId: z.string().min(1, 'Node ID is required'),
  eventType: z.enum(['heartbeat', 'quiz_submit', 'skip', 'confidence_rating']),
  quizScore: z.number().min(0).max(100).optional(),
  timeOnTaskSeconds: z.number().min(0).optional(),
  skipsCount: z.number().min(0).optional(),
  confidenceLevel: z.number().min(1).max(5).optional(),
  timestamp: z.number().optional(),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RoutingEvaluateSchema = z.object({
  nodeId: z.string().min(1, 'Node ID is required'),
  signal: TelemetrySchema.optional(),
});
