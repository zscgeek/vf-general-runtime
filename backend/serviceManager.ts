import {
  buildClients,
  buildControllers,
  buildMiddleware,
  buildServices,
  ClientMap,
  ControllerMap,
  FullServiceMap,
  MiddlewareMap,
} from '@/lib';
import { initClients, stopClients } from '@/lib/clients';
import { Config } from '@/types';

export interface ServiceManagerBuilders {
  buildClients?: typeof buildClients;
  buildServices?: typeof buildServices;
  buildMiddleware?: typeof buildMiddleware;
  buildControllers?: typeof buildControllers;
}

class ServiceManager {
  clients: ClientMap;

  services: FullServiceMap;

  middlewares: MiddlewareMap;

  controllers: ControllerMap;

  constructor(public config: Config, builders: ServiceManagerBuilders = {}) {

    // Clients
    this.clients = (builders.buildClients ?? buildClients)(config);

    // Services
    this.services = (builders.buildServices ?? buildServices)(config, this.clients);

    // Middleware
    this.middlewares = (builders.buildMiddleware ?? buildMiddleware)(this.services, config);

    // Controllers
    this.controllers = (builders.buildControllers ?? buildControllers)(this.services, config);
  }

  /**
   * Start services
   */
  async start() {
    await initClients(this.clients);
  }

  /**
   * Stop services
   */
  async stop() {
    await stopClients(this.config, this.clients);
  }
}

export default ServiceManager;
