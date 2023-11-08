export const processEnvGet = (name: string): string | null => {
  return process.env[name] || null;
};

export const processEnvGetString = (name: string): string => {
  const value = processEnvGet(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};
