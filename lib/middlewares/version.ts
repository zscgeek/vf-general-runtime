import { BaseModels } from '@voiceflow/base-types';
import VError from '@voiceflow/verror';
import { NextFunction, Response } from 'express';

import { CreatorDataApi, Program } from '@/runtime';
import { Request } from '@/types';

import { AbstractMiddleware } from './utils';

class Version extends AbstractMiddleware {
  async resolveVersionID(
    req: Request<Record<string, unknown>, unknown, { versionID?: string; authorization?: string }>,
    _res: Response,
    next: NextFunction
  ) {
    const {
      headers: { versionID, authorization: apiKey },
    } = req;

    const isValidAPIKey = BaseModels.ApiKey.isDialogManagerAPIKey(apiKey);

    try {
      // Case 1 - Missing version ID, resolve if API key provided
      if (!versionID) {
        if (!isValidAPIKey) {
          throw new VError('Missing version ID header', 400);
        }

        const project = await this.getProjectFromAPIKey(apiKey);

        req.headers.prototype = 'api';
        req.headers.versionID = project!.devVersion!.toString();

        return next();
      }

      // Case 2 - Non-alias version ID, proceed normally
      if (!['Production', 'Staging'].includes(versionID)) {
        return next();
      }

      // Case 3 - Alias version ID, resolve into actual version ID
      if (!isValidAPIKey) {
        throw new VError('Could not resolve alias, please check your API key', 400);
      }

      const project = await this.getProjectFromAPIKey(apiKey);

      const { devVersion, liveVersion } = project;
      req.headers.versionID = versionID === 'Production' ? liveVersion : devVersion;

      return next();
    } catch (err) {
      if (err instanceof VError) throw err;
      else throw new VError('no permissions for this version', VError.HTTP_STATUS.UNAUTHORIZED);
    }
  }

  async getProjectFromAPIKey(apiKey: string) {
    const api = await this.services.dataAPI.get(apiKey).catch((error) => {
      throw new VError(`invalid API key: ${error}`, VError.HTTP_STATUS.UNAUTHORIZED);
    });

    if (!(api instanceof CreatorDataApi)) {
      throw new VError('Version lookup only supported via Creator Data API', VError.HTTP_STATUS.UNAUTHORIZED);
    }

    const project = await api.getProjectUsingAuthorization(apiKey).catch(() => null);
    if (!project) {
      throw new VError('Cannot infer project version, provide a specific version in the versionID header', 404);
    }

    return project;
  }
}

export default Version;
