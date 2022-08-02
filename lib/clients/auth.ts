import { AuthSDK } from '@voiceflow/sdk-auth';
import fetch from 'node-fetch';

import { Config } from '@/types';

export type AuthType = AuthSDK<Permission>;

const Auth = (config: Config): AuthType => new AuthSDK(config.AUTH_SERVICE_ENDPOINT, fetch);

export default Auth;

export enum Permission {
  WORKSPACE_WRITE = 'workspace:write',
  WORKSPACE_WRITE_MEMBER = 'workspace:write:members',
  WORKSPACE_WRITE_BILLING = 'workspace:write:billing',
  WORKSPACE_READ_BILLING = 'workspace:read:billing',
  TEAM_READ = 'team:read',
  TEAM_WRITE = 'team:write',
  PROJECT_READ = 'project:read',
  PROJECT_READ_LIST = 'project:read:list',
  PROJECT_WRITE = 'project:write',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  VERSION_READ = 'version:read',
  VERSION_READ_LIST = 'version:read:list',
  VERSION_WRITE = 'version:write',
  VERSION_UPDATE = 'version:update',
  VERSION_DELETE = 'version:delete',
  PROJECT_MEMBER_READ_LIST = 'projectMember:read:list',
  PROJECT_MEMBER_READ = 'projectMember:read',
  PROJECT_MEMBER_WRITE = 'projectMember:write',
  PROJECT_MEMBER_UPDATE = 'projectMember:update',
  PROJECT_MEMBER_DELETE = 'projectMember:delete',
  DIAGRAM_READ = 'diagram:read',
  DIAGRAM_READ_LIST = 'diagram:read:list',
  DIAGRAM_WRITE = 'diagram:write',
  DIAGRAM_DELETE = 'diagram:delete',
  DIAGRAM_UPDATE = 'diagram:update',
  PROGRAM_READ = 'program:read',
  PROGRAM_READ_LIST = 'program:read:list',
  PROGRAM_UPDATE = 'program:update',
  PROGRAM_DELETE = 'program:delete',
  TRANSCRIPT_WRITE = 'transcript:write',
  TRANSCRIPT_READ = 'transcript:read',
  API_KEY_READ = 'apiKey:read',
  API_KEY_READ_LIST = 'apiKey:read:list',
  API_KEY_WRITE = 'apiKey:write',
  API_KEY_UPDATE = 'apiKey:update',
  API_KEY_DELETE = 'apiKey:delete',
  NOTE_WRITE = 'note:write',
  NOTE_READ = 'note:read',
  DIALOG_MANAGER_API_KEY_READ = 'dialogManagerAPIKey:read',
  DIALOG_MANAGER_API_KEY_READ_LIST = 'dialogManagerAPIKey:read:list',
  DIALOG_MANAGER_API_KEY_WRITE = 'dialogManagerAPIKey:write',
  DIALOG_MANAGER_API_KEY_UPDATE = 'dialogManagerAPIKey:update',
  DIALOG_MANAGER_API_KEY_DELETE = 'dialogManagerAPIKey:delete',
}
