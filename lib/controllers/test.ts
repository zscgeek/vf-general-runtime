import { getAPIBlockHandlerOptions } from '@/lib/services/runtime/handlers/api';
import {
  answerSynthesis,
  fetchKnowledgeBase,
  KnowledegeBaseChunk,
  questionExpansion,
} from '@/lib/services/runtime/handlers/utils/knowledgeBaseNoMatch';
import { callAPI } from '@/runtime/lib/Handlers/api/utils';
import { ivmExecute } from '@/runtime/lib/Handlers/code/utils';
import { Request, Response } from '@/types';

import { AbstractController } from './utils';

class TestController extends AbstractController {
  async testAPI(req: Request, res: Response) {
    const { responseJSON } = await callAPI(req.body.api, getAPIBlockHandlerOptions(this.config));
    if (responseJSON.VF_STATUS_CODE) {
      res.status(responseJSON.VF_STATUS_CODE);
    }
    res.send(responseJSON);
  }

  async testCode(req: Request, res: Response) {
    if (typeof req.body.code !== 'string') {
      res.status(400).send({ error: 'code must be a string' });
      return;
    }
    if (typeof req.body.variables !== 'object') {
      res.status(400).send({ error: 'variables must be an object' });
      return;
    }

    try {
      const startTime = performance.now();
      const variables = await ivmExecute({ code: req.body.code, variables: req.body.variables });
      res.send({ variables, time: performance.now() - startTime });
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  }

  async testKnowledgeBase(req: Request, res: Response) {
    const api = await this.services.dataAPI.get(req.headers.authorization);

    // if DM API key infer project from header
    const project = await api.getProject(req.body.projectID || req.headers.authorization);

    const { question, settings, synthesis = true } = req.body;

    // const questions = await questionExpansion(question);
    const questions = [question];

    const data = await Promise.all(questions.map((question) => fetchKnowledgeBase(project._id, question, settings)));

    const chunkMap: Record<string, KnowledegeBaseChunk & { source: any }> = {};
    data.forEach((data) => {
      if (!data) return;
      data.chunks.forEach((chunk) => {
        // attach metadata to chunks
        chunkMap[chunk.chunkID] = { ...chunk, source: project.knowledgeBase?.documents?.[chunk.documentID]?.data };
      });
    });

    const chunks = Object.values(chunkMap);
    // keep the 3 top chunks with lowest scores
    chunks.sort((a, b) => b.score - a.score);
    chunks.splice(3);

    if (!data) return res.send({ output: null, chunks: [] });

    if (!synthesis) return res.send({ output: null, chunks });

    const answer = await answerSynthesis({ question, data: { chunks }, options: settings?.summarization });

    if (!answer?.output) return res.send({ output: null, chunks });

    return res.send({ output: answer.output, chunks });
  }
}

export default TestController;
