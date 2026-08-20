import axios from "axios";
import { env } from "../../config/env.config.ts";

export const verifyGoogleIdToken = async (idToken: string) => {
  const { data } = await axios.get("https://oauth2.googleapis.com/tokeninfo", {
    params: { id_token: idToken },
    timeout: 10000,
  });

  if (data.aud !== env.GOOGLE_CLIENT_ID) {
    throw new Error("Invalid Google token audience");
  }

  if (!data.sub) throw new Error("Invalid Google token");

  return data;
};
