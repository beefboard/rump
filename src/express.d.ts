import { AuthSession } from './auth/accounts';

declare global {
  namespace Express {
    export interface Request {
      session: AuthSession | any;
    }
  }
}
