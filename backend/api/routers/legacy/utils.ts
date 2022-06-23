import { Request, Response } from 'express';

export const redirect = (alias: string) => (_req: Request, res: Response) => {
  res.redirect(alias);
};
