import { PubSub } from '@google-cloud/pubsub';

import { Config } from '@/types';

export const PubSubClient = ({ PUBSUB_PROJECT_ID }: Config): PubSub => new PubSub({ projectId: PUBSUB_PROJECT_ID });

export default PubSubClient;
