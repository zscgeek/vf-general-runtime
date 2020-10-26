import axios from 'axios';
import fs from 'fs';
import path from 'path';

const Static = {
  fs,
  path,
  axios,
} as const;

export type StaticType = typeof Static;

export default Static;
