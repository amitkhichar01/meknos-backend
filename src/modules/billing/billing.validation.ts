import { z } from "zod";

export const createOrderSchema = z
  .object({
    planCode: z.string().trim().min(1, "Plan code is required"),
  })
  .strict();

export const orderIdParamSchema = z.object({
  orderId: z.string().trim().min(1, "Order ID is required"),
});
