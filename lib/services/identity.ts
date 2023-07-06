import fetch from 'node-fetch';

import { AbstractManager } from './utils';

export class IdentityService extends AbstractManager {
  private client?: unknown;

  private async getClient() {
    const sdk = await import('@voiceflow/sdk-identity').catch(() => null);
    if (!sdk) return undefined;

    if (!this.client) {
      const baseURL =
        this.config.IDENTITY_API_SERVICE_HOST && this.config.IDENTITY_API_SERVICE_PORT_APP
          ? new URL(
              `${this.config.NODE_ENV === 'e2e' ? 'https' : 'http'}://${this.config.IDENTITY_API_SERVICE_HOST}:${
                this.config.IDENTITY_API_SERVICE_PORT_APP
              }`
            ).href
          : null;

      if (!baseURL) return undefined;

      this.client = new sdk.IdentityClient({
        baseURL,
        fetch,
      });
    }

    return this.client as InstanceType<typeof sdk.IdentityClient>;
  }

  async consumeQuota(workspaceID: string, quotaName: QuotaName, count: number) {
    const client = await this.getClient();
    if (!client) return null;

    return client.private.consumeWorkspaceQuotaByName(workspaceID, quotaName, count);
  }
}
