/* eslint no-process-exit: "off", no-process-env: "off" */
import { once } from 'events';
import express, { Express } from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';

import { ExpressMiddleware, ServiceManager } from './backend';
import log from './logger';
import pjson from './package.json';

const name = pjson.name.replace(/^@[\dA-Za-z-]+\//g, '');

export default class Server {
  public readonly app: Express;

  public readonly server: https.Server | http.Server;

  constructor(public serviceManager: ServiceManager) {
    this.app = express();

    if (process.env.NODE_ENV === 'e2e') {
      this.server = https.createServer(
        {
          key: fs.readFileSync('./certs/localhost.key'),
          cert: fs.readFileSync('./certs/localhost.crt'),
          requestCert: false,
          rejectUnauthorized: false,
        },
        this.app
      );
    } else {
      this.server = http.createServer(this.app);
    }

    const { middlewares, controllers } = this.serviceManager;

    ExpressMiddleware.attach(this.app, middlewares, controllers);
  }

  /**
   * Start server
   * - Creates express app and services
   */
  async start(port: number | string) {
    // Start services.
    await this.serviceManager.start();

    this.server.listen(port);
    await once(this.server, 'listening');

    log.info(`[http] ${name} listening ${log.vars({ port })}`);
  }

  /**
   * Stop server
   * - Stops services first, then server
   */
  async stop() {
    // Stop services
    await this.serviceManager.stop();

    if (this.server) {
      this.server.close();
      await once(this.server, 'close');
    }
  }
}
