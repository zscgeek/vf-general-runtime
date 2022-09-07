import { BaseModels } from '@voiceflow/base-types';
import { VoiceflowProgram, VoiceflowProject, VoiceflowVersion } from '@voiceflow/voiceflow-types';
import { ObjectId } from 'mongodb';

import { DataAPI } from '@/runtime';
import { extractAPIKeyID } from '@/runtime/lib/DataAPI/utils';
import { Config } from '@/types';

import MongoDB from './mongodb';

class MongoDataAPI implements DataAPI<VoiceflowProgram.Program, VoiceflowVersion.Version, VoiceflowProject.Project> {
  client: MongoDB;

  constructor(config: Config) {
    this.client = new MongoDB(config);
  }

  async init() {
    return this.client.start();
  }

  public getVersion = async (versionID: string) => {
    const version = await this.client.db
      .collection('versions')
      .findOne<VoiceflowVersion.Version>({ _id: new ObjectId(versionID) });

    if (!version) {
      throw Error();
    }

    version.projectID = version.projectID.toString();
    version.rootDiagramID = version.rootDiagramID.toString();

    return version;
  };

  public unhashVersionID = async (versionID: string) => versionID;

  async getProject(projectID: string) {
    const project = await this.client.db
      .collection('projects')
      .findOne<VoiceflowProject.Project>({ _id: new ObjectId(projectID) });
    return project!;
  }

  fetchDisplayById = async () => null;

  async getProjectNLP(projectID: string) {
    const project = await this.getProject(projectID);
    return {
      nlp: project.prototype?.nlp,
      devVersion: project.devVersion,
      liveVersion: project.liveVersion,
    };
  }

  public getProjectUsingAPIKey = async (key: string) => {
    const apiKeyID = extractAPIKeyID(key);

    const data = await this.client.db
      .collection('api-keys')
      .findOne<BaseModels.ApiKey.Model>({ _id: new ObjectId(apiKeyID) });

    return this.getProject(data!.projectID!);
  };

  async getProgram(programID: string) {
    const program = await this.client.db
      .collection('prototype-programs')
      .findOne<VoiceflowProgram.Program>({ _id: new ObjectId(programID) });
    return program!;
  }
}

export default MongoDataAPI;
