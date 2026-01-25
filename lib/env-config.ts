// IMPORTANT: When adding new env variables to the codebase, update this array
export const ENV_VARIABLES: EnvVariable[] = [
  {
    name: "DATABASE_URL",
    description:
      "PostgreSQL connection string for Neon database analytics",
    required: true,
    instructions:
      "Get your DATABASE_URL from your Neon dashboard. This is required for reading analytics and metrics.",
  },
  {
    name: "DEEPSEEK_API_KEY",
    description:
      "API key for DeepSeek AI service for Lenormand reading interpretations",
    required: false,
    instructions:
      "Get your API key from https://platform.deepseek.com/api-keys. Optional - AI features will be disabled if not provided.",
  },
  {
    name: "DEEPSEEK_BASE_URL",
    description:
      "Base URL for DeepSeek API (optional, defaults to https://api.deepseek.com)",
    required: false,
    instructions:
      "Only set if using a custom DeepSeek endpoint. Default is the official API endpoint without /v1 suffix.",
  },
];

export interface EnvVariable {
  name: string;
  description: string;
  instructions: string;
  required: boolean;
}

export function checkMissingEnvVars(): string[] {
  return ENV_VARIABLES.filter(
    (envVar) => envVar.required && !process.env[envVar.name],
  ).map((envVar) => envVar.name);
}
