import type { z } from "zod";

import {
  createUserProfileSchema,
  updateUserProfileSchema,
  userProfileSchema,
} from "./userProfile.validation.ts";

export type IUserProfile = z.infer<typeof userProfileSchema>;

export type ICreateUserProfileInput = z.infer<typeof createUserProfileSchema>;

export type IUpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
