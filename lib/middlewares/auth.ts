/* eslint-disable max-classes-per-file */

import { Validator } from '@voiceflow/backend-utils';
import { Permission } from '@voiceflow/sdk-auth';
import { createAuthGuard } from '@voiceflow/sdk-auth/express';
import express from 'express';

import { Config, Next, Request, Response } from '@/types';

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
  private readonly middleware = this.services.auth ? createAuthGuard(this.services.auth) : undefined;

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
  async assertPermissionsMiddleware(req: Request, res: Response, next: express.NextFunction): Promise<void | never> {
    const middleware = this.middleware?.(this.permissions);

    return middleware ? middleware(req, res, next) : next();
  }
}
