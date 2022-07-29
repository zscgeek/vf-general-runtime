/* eslint-disable max-classes-per-file */

import { Validator } from '@voiceflow/backend-utils';
import { AuthorizationException, ResourceIDs } from '@voiceflow/sdk-auth';
import VError from '@voiceflow/verror';
import express from 'express';

import { Config, Next, Request, Response } from '@/types';

import { Permission } from '../clients/auth';
import { FullServiceMap } from '../services';
import { ignore, validate } from '../utils';
import { AbstractMiddleware } from './utils';

const VALIDATIONS = {
  HEADERS: {
    VERSION_ID: Validator.header('versionID').isString().optional(),
    PROJECT_ID: Validator.header('projectID').isString().optional(),
    AUTHORIZATION: Validator.header('authorization').isString(),
  },
};

export class AuthFactory {
  constructor(private readonly services: FullServiceMap, private readonly config: Config) {}

  @ignore()
  requirePermissions(
    ...permissions: readonly [Permission, ...Permission[]]
  ): (req: Request, res: Response, next: Next) => Promise<void> {
    const auth = new Auth(this.services, this.config, permissions);

    return auth.assertPermissionsMiddleware.bind(auth);
  }
}

export class Auth extends AbstractMiddleware {
  constructor(
    services: FullServiceMap,
    config: Config,
    private readonly permissions: readonly [Permission, ...Permission[]]
  ) {
    super(services, config);
  }

  @validate({
    HEADER_AUTHORIZATION: VALIDATIONS.HEADERS.AUTHORIZATION,
    HEADER_VERSION_ID: VALIDATIONS.HEADERS.VERSION_ID,
    HEADER_PROJECT_ID: VALIDATIONS.HEADERS.PROJECT_ID,
  })
  async assertPermissionsMiddleware(_req: Request, _res: Response, next: express.NextFunction): Promise<void | never> {
    const req = _req as Request<
      any,
      any,
      {
        versionID?: string;
        projectID?: string;
        authorization: string;
      }
    >;

    const { versionID, projectID } = req.headers;

    try {
      await this.services.auth.assertAuthorized(
        // TODO: Pretty sure this is wrong
        `ApiKey ${req.headers.authorization}`,
        this.permissions,
        // This assertion is safe, it's okay if no headers are present & every permissions check fails as unauthorized
        { versionID, projectID } as ResourceIDs
      );
    } catch (error) {
      if (AuthorizationException.isAuthorizationException(error)) {
        next(new VError(error.message, VError.HTTP_STATUS.FORBIDDEN));
        return;
      }

      next(error instanceof VError ? error : new VError('Unknown error', VError.HTTP_STATUS.INTERNAL_SERVER_ERROR));
      return;
    }

    next();
  }
}
