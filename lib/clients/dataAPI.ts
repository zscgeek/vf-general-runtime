import { VoiceflowConstants, VoiceflowProgram, VoiceflowVersion } from '@voiceflow/voiceflow-types';

import { LocalDataApi } from '@/runtime';
import { Config } from '@/types';

import RemoteDataAPI from './remoteDataAPI';
import Static from './static';

/**
 * Build all clients
 */
class DataAPI {
  localDataApi?: LocalDataApi<VoiceflowProgram.Program, VoiceflowVersion.Version>;

  remoteDataApi?: RemoteDataAPI;

  constructor(config: Config, API = { LocalDataApi, RemoteDataAPI }) {
    const { PROJECT_SOURCE, ADMIN_SERVER_DATA_API_TOKEN, VF_DATA_ENDPOINT } = config;

    // fetch from local VF file
    if (PROJECT_SOURCE) {
      this.localDataApi = new API.LocalDataApi({ projectSource: PROJECT_SOURCE }, { fs: Static.fs, path: Static.path });
    }

    // fetch from server-data-api
    if (ADMIN_SERVER_DATA_API_TOKEN && VF_DATA_ENDPOINT) {
      this.remoteDataApi = new API.RemoteDataAPI(
        {
          platform: VoiceflowConstants.PlatformType.GENERAL,
          adminToken: ADMIN_SERVER_DATA_API_TOKEN,
          dataEndpoint: VF_DATA_ENDPOINT,
        },
        { axios: Static.axios }
      );
    }

    // configuration not set
    if (!PROJECT_SOURCE && (!VF_DATA_ENDPOINT || !ADMIN_SERVER_DATA_API_TOKEN)) {
      throw new Error('no data API env configuration set');
    }
  }

  public async init() {
    await this.localDataApi?.init();
    await this.remoteDataApi?.init();
  }

  public async get() {
    if (this.localDataApi) {
      return this.localDataApi;
    }

    if (this.remoteDataApi) {
      return this.remoteDataApi;
    }

    throw new Error('no data API env configuration set');
  }
}

export default DataAPI;
