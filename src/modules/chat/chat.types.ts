import { Types } from "mongoose";
import type { z } from "zod";
import type { sendMessageSchema } from "./chat.validation.ts";

export type ISendMessageInput = z.infer<typeof sendMessageSchema>;

export interface IChatMessageResponse {
  _id: Types.ObjectId;
  role: string;
  content: string;
  createdAt: Date;
}

export interface IChatSessionResponse {
  _id: Types.ObjectId;
  messageCount: number;
  status: string;
}

export interface IChatHistoryResponse {
  session: IChatSessionResponse | null;
  messages: IChatMessageResponse[];
}

export interface ISendMessageResponseData {
  message: IChatMessageResponse;
  session: IChatSessionResponse;
}
