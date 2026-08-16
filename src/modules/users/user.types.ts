import type { z } from "zod";

import {
  createUserSchema,
  updateUserSchema,
  userSchema,
} from "./user.validation.ts";

export type IUser = z.infer<typeof userSchema>;

export type ICreateUserInput = z.infer<typeof createUserSchema>;

export type IUpdateUserInput = z.infer<typeof updateUserSchema>;
