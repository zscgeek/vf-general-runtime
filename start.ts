import 'core-js';
import 'regenerator-runtime/runtime';
import './tracer';

import fs from 'fs';
import v8 from 'v8';

import { ServiceManager } from './backend';
import config from './config';
import log from './logger';
import Server from './server';

(async () => {
  const serviceManager = new ServiceManager(config);
  const server = new Server(serviceManager, config);

  // Graceful shutdown from SIGTERM
  process.on('SIGTERM', async () => {
    log.warn('[app] [http] SIGTERM received stopping server');

    await server.stop();

    log.warn('[app] exiting');

    // eslint-disable-next-line no-process-exit
    process.exit(0);
  });

  process.on('unhandledRejection', (rejection, promise) => {
    log.error(`[app] unhandled rejection ${log.vars({ rejection, promise })}`);
  });

  process.on('SIGUSR2', () => {
    const heapSnapshotStream = v8.getHeapSnapshot();
    log.info(`[app] [memory] heap snapshot`);
    const heapDumpFile = `heapdump-${Date.now()}.heapsnapshot`;
    const fileStream = fs.createWriteStream(heapDumpFile);
    heapSnapshotStream.pipe(fileStream).on('finish', () => {
      log.info(`[app] [memory] heap snapshot written to ${heapDumpFile}`);
    });
  });

  try {
    await server.start();
  } catch (error) {
    log.error(`[app] [http] failed to start server ${log.vars({ error })}`);
  }
})();
