import crypto from "node:crypto";

const generateUsername = (name: string) => {
  const baseName = name && name.trim() ? name : null;

  if (!baseName) return null;

  const cleanName = baseName.toLowerCase().trim().replace(/\s+/g, "-");

  // Generate a random 8-character hex suffix
  const randomSuffix = crypto.randomBytes(4).toString("hex");

  return `${cleanName}-${randomSuffix}`;
};

export default generateUsername;
