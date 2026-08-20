import type { Request, Response } from "express";
import sendResponse from "../../utils/sendResponse.ts";
import { sendMessageSchema } from "./chat.validation.ts";
import { sendMessageToProfileService, getChatHistoryService } from "./chat.service.ts";

export const sendMessage = async (req: Request<{ username: string }>, res: Response) => {
  try {
    const visitorId = req.visitorId;
    if (!visitorId) {
      return sendResponse(res, 400, {}, "Visitor identifier missing");
    }

    const { username } = req.params;
    if (!username) {
      return sendResponse(res, 400, {}, "Username parameter is required");
    }

    const validation = sendMessageSchema.safeParse(req.body);
    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message || "Invalid input data";
      return sendResponse(res, 400, {}, errorMessage);
    }

    const result = await sendMessageToProfileService({
      username,
      visitorId,
      messageText: validation.data.message,
    });

    return sendResponse(res, 200, { data: result }, "Message processed successfully");
  } catch (error: any) {
    console.error("[Chat Controller Error - sendMessage]:", error);

    if (error.statusCode === 404) {
      return sendResponse(res, 404, {}, error.message || "User profile not found");
    }

    return sendResponse(
      res,
      500,
      {},
      "Unable to process your message right now. Please try again later."
    );
  }
};

export const getChatHistory = async (req: Request<{ username: string }>, res: Response) => {
  try {
    const visitorId = req.visitorId;
    if (!visitorId) {
      return sendResponse(res, 400, {}, "Visitor identifier missing");
    }

    const { username } = req.params;
    if (!username) {
      return sendResponse(res, 400, {}, "Username parameter is required");
    }

    const result = await getChatHistoryService({
      username,
      visitorId,
    });

    return sendResponse(res, 200, { data: result }, "Chat history fetched successfully");
  } catch (error: any) {
    console.error("[Chat Controller Error - getChatHistory]:", error);

    if (error.statusCode === 404) {
      return sendResponse(res, 404, {}, error.message || "User profile not found");
    }

    return sendResponse(
      res,
      500,
      {},
      "Unable to fetch chat history right now. Please try again later."
    );
  }
};
