import { Validator } from '@voiceflow/backend-utils';
import VError from '@voiceflow/verror';
import { NextFunction, Response } from 'express';

import { validate } from '@/lib/utils';
import { Request } from '@/types';

import { AbstractMiddleware } from './utils';

const { header } = Validator;
const VALIDATIONS = {
  HEADERS: {
    VERSION_ID: header('versionID').optional().isString(),
    AUTHORIZATION: header('authorization').exists().isString(),
  },
};
class Project extends AbstractMiddleware {
  static VALIDATIONS = VALIDATIONS;

  async unifyVersionID(req: Request<{ versionID?: string }, null, { version?: string }>, _res: Response, next: NextFunction): Promise<void> {
    // Version ID provided as param in older versions
    req.headers.versionID = req.headers.versionID ?? req.params.versionID;
    next();
  }

  @validate({
    HEADERS_VERSION_ID: VALIDATIONS.HEADERS.VERSION_ID,
    HEADERS_AUTHORIZATION: VALIDATIONS.HEADERS.AUTHORIZATION,
  })
  async attachProjectID(req: Request<Record<string, unknown>, unknown, { versionID?: string }>, _res: Response, next: NextFunction): Promise<void> {
    const { versionID } = req.headers;

    if (!versionID) {
      throw new VError('Could not resolve the version ID', 400);
    }

    const api = await this.services.dataAPI.get(req.headers.authorization).catch((error) => {
      throw new VError(`invalid API key: ${error}`, VError.HTTP_STATUS.UNAUTHORIZED);
    });

    try {
      const { projectID } = await api.getVersion(versionID);
      req.headers.projectID = projectID;
      return next();
    } catch (err) {
      if (err instanceof VError) throw err;
      else throw new VError('no permissions for this version', VError.HTTP_STATUS.UNAUTHORIZED);
    }
  }
}

export default Project;
