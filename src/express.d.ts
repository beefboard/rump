import { AuthSession } from './data/db/db';

declare global {
  namespace Express {
    export interface Request {
      session?: AuthSession;
    }
  }
}
