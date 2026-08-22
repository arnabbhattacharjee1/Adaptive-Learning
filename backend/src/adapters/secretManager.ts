import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

/**
 * Fetch secret from GCP Secret Manager with local env fallback.
 */
export async function getSecret(secretName: string, defaultValue?: string): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId || process.env.NODE_ENV !== 'production') {
    return process.env[secretName] || defaultValue || 'alis-jwt-super-secret-key-2026';
  }

  try {
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    if (payload) return payload;
  } catch (err) {
    console.warn(`[GCP Secret Manager Warning] Failed to access ${secretName}, using fallback env:`, err);
  }

  return process.env[secretName] || defaultValue || 'alis-jwt-super-secret-key-2026';
}
