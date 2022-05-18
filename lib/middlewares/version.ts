import { Validator } from '@voiceflow/backend-utils';
import { BaseModels } from '@voiceflow/base-types';
import VError from '@voiceflow/verror';
import { NextFunction, Response } from 'express';

import { validate } from '@/lib/utils';
import { CreatorDataApi } from '@/runtime';
import { PredictionStage, Request } from '@/types';

import { AbstractMiddleware } from './utils';

const { header } = Validator;
const VALIDATIONS = {
  HEADERS: {
    VERSION_ID: header('versionID').optional().isString(),
    AUTHORIZATION: header('authorization').exists().isString(),
  },
};

class Version extends AbstractMiddleware {
  static VALIDATIONS = VALIDATIONS;

  @validate({
    HEADERS_VERSION_ID: VALIDATIONS.HEADERS.VERSION_ID,
    HEADERS_AUTHORIZATION: VALIDATIONS.HEADERS.AUTHORIZATION,
  })
  async resolveVersionID(
    req: Request<Record<string, unknown>, unknown, { versionID?: string; authorization: string }>,
    _res: Response,
    next: NextFunction
  ) {
    const {
      headers: { versionID, authorization: apiKey },
    } = req;

    if (!BaseModels.ApiKey.isDialogManagerAPIKey(apiKey)) {
      throw new VError('Invalid API key', 400);
    }

    try {
      // Retrieve project information to resolve version and its associated stage
      const { devVersion, liveVersion } = await this.getProjectFromAPIKey(apiKey);

      // Case 1 - Missing version ID, default to `devVersion`
      if (!versionID) {
        req.headers.prototype = 'api';
        req.headers.versionID = devVersion;
        req.headers.stage = PredictionStage.STAGING;

        return next();
      }

      // Case 2 - Non-alias version ID, proceed normally
      if (!Object.values<string>(PredictionStage).includes(versionID)) {
        req.headers.stage = this.getStage(versionID, liveVersion);
        return next();
      }

      // Case 3 - Alias version ID, resolve into actual version ID
      req.headers.versionID = versionID === PredictionStage.PROD ? liveVersion : devVersion;
      req.headers.stage = this.getStage(versionID, liveVersion);
      return next();
    } catch (err) {
      if (err instanceof VError) throw err;
      else throw new VError('no permissions for this version', VError.HTTP_STATUS.UNAUTHORIZED);
    }
  }

  getStage(versionID: string, liveVersion?: string) {
    return liveVersion === versionID ? PredictionStage.PROD : PredictionStage.STAGING;
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
