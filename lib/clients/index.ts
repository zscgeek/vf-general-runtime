import { DataAPI, LocalDataApi, ServerDataApi } from '@voiceflow/client';
import secretsProvider from '@voiceflow/secrets-provider';

import { Config } from '@/types';

import Metrics, { MetricsType } from './metrics';
import Static, { StaticType } from './static';

export interface ClientMap extends StaticType {
  dataAPI: DataAPI;
  metrics: MetricsType;
}

/**
 * Build all clients
 */
const buildClients = (config: Config): ClientMap => {
  const dataAPI = config.PROJECT_SOURCE
    ? new LocalDataApi({ projectSource: config.PROJECT_SOURCE }, { fs: Static.fs, path: Static.path })
    : new ServerDataApi({ dataSecret: secretsProvider.get('VF_DATA_SECRET'), dataEndpoint: config.VF_DATA_ENDPOINT }, { axios: Static.axios });
  const metrics = Metrics(config);

  return {
    ...Static,
    dataAPI,
    metrics,
  };
};

export default buildClients;
