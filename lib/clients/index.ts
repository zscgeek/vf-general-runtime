import { DataAPI, LocalDataApi } from '@voiceflow/runtime';

import { Config } from '@/types';

import Luis from './luis';
import Metrics, { MetricsType } from './metrics';
import RemoteDataAPI from './remoteDataAPI';
import Static, { StaticType } from './static';

export interface ClientMap extends StaticType {
  luis: Luis;
  dataAPI: DataAPI;
  metrics: MetricsType;
}

/**
 * Build all clients
 */
const buildClients = (config: Config): ClientMap => {
  const dataAPI = config.PROJECT_SOURCE
    ? new LocalDataApi({ projectSource: config.PROJECT_SOURCE }, { fs: Static.fs, path: Static.path })
    : new RemoteDataAPI(
        { platform: 'general', adminToken: config.ADMIN_SERVER_DATA_API_TOKEN, dataEndpoint: config.VF_DATA_ENDPOINT },
        { axios: Static.axios }
      );

  return {
    ...Static,
    luis: new Luis(config),
    dataAPI,
    metrics: Metrics(config),
  };
};

export const initClients = async (clients: ClientMap) => {
  await clients.dataAPI.init();
};

export default buildClients;
