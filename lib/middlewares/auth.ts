import { Validator } from '@voiceflow/backend-utils';
import VError from '@voiceflow/verror';
import { NextFunction, Response } from 'express';
import jwt_decode, { JwtPayload } from 'jwt-decode';

import { validate } from '@/lib/utils';
import { Request } from '@/types';

import { AbstractMiddleware } from './utils';

const { header } = Validator;
const VALIDATIONS = {
  HEADERS: {
    PROJECT_ID: header('projectID').exists().isString(),
    AUTHORIZATION: header('authorization').exists().isString(),
  },
};
class Auth extends AbstractMiddleware {
  static VALIDATIONS = VALIDATIONS;

  @validate({
    HEADERS_PROJECT_ID: VALIDATIONS.HEADERS.PROJECT_ID,
    HEADERS_AUTHORIZATION: VALIDATIONS.HEADERS.AUTHORIZATION,
  })
  async validateOrigin(
    req: Request<
      Record<string, unknown>,
      { config?: { adapter?: string; verification?: string } } | null,
      { projectID?: string }
    >,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    if (!req.headers.projectID) {
      throw new VError('Missing prijectID header', VError.HTTP_STATUS.BAD_REQUEST);
    }

    if (req.body?.config?.adapter === 'google-assistant') {
      if (!req.body?.config?.verification) {
        throw new VError('Missing Google JWT', VError.HTTP_STATUS.BAD_REQUEST);
      }
      const api = await this.services.dataAPI.get(req.headers.authorization);
      const project = await api.getProject(req.headers.projectID);

      const decoded = jwt_decode<JwtPayload>(req.body.config.verification);

      if (!project.members.find((member) => member.platformData.googleProjectID === decoded.aud)) {
        throw new VError('Invalid Google JWT', VError.HTTP_STATUS.UNAUTHORIZED);
      }
    }

    next();
  }
}

export default Auth;
