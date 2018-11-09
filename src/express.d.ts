import { AuthSession } from './auth/db/db';

declare global {
  namespace Express {
    export interface Request {
      session: AuthSession | any;
    }
  }
}
