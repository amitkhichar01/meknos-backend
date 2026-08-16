import type { IUser } from "#src/modules/users/user.types.ts";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
