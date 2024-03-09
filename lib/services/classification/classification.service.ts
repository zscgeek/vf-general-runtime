import { IntentPrediction, PredictOptions } from './interfaces/nlu.interface';
import { AbstractManager } from '../utils';
import { GeneralRuntime } from '../runtime/types';
import { VersionTag } from '@/types';
import { BaseModels } from '@voiceflow/base-types';

export class ClassificationService extends AbstractManager {
  private get nluGatewayURL() {
    const protocol = this.config.CLOUD_ENV === 'e2e' ? 'https' : 'http';
    return `${protocol}://${this.config.NLU_GATEWAY_SERVICE_HOST}:${this.config.NLU_GATEWAY_SERVICE_PORT_APP}`;
  }

  public async predict(runtime: GeneralRuntime, utterance: string, options?: PredictOptions): Promise<IntentPrediction | null> {
    const prediction = await this.nluPredict(runtime, utterance, options);

    if (prediction && runtime.project?.nluSettings?.classifyStrategy === BaseModels.Project.ClassifyStrategy.VF_NLU_LLM_HYBRID) {
      return this.llmHybridPredict(runtime, prediction);
    }

    return prediction;
  }

  private async nluPredict(runtime: GeneralRuntime, utterance: string, options?: PredictOptions): Promise<IntentPrediction | null> {
    const {data: prediction} = await this.services.axios
      .post<IntentPrediction | null>(`${this.nluGatewayURL}/v1/predict/${runtime.versionID}`, {
        utterance: utterance,
        tag: runtime.project!.liveVersion === runtime.versionID ? VersionTag.PRODUCTION : VersionTag.DEVELOPMENT,
        workspaceID: runtime.project!.teamID,
        filteredIntents: options?.filteredIntents ?? [],
        filteredEntities: options?.filteredEntities ?? [],
        excludeFilteredIntents: true,
        excludeFilteredEntities: true,
      })
      .catch(() => ({ data: null }));

    return prediction;
  }

  private async llmHybridPredict(_runtime: GeneralRuntime, prediction: IntentPrediction): Promise<IntentPrediction | null> {
    return prediction;
  }
}
