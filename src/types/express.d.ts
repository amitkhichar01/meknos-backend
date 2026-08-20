import type { IUser } from "../../modules/users/user.types.ts";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      visitorId?: string;
    }
  }
}

export {};
