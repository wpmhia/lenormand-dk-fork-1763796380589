// IMPORTANT: When adding new env variables to the codebase, update this array
export const ENV_VARIABLES: EnvVariable[] = [
  {
    name: "DEEPSEEK_API_KEY",
    description: "API key for DeepSeek AI service for Lenormand reading interpretations",
    required: false,
    instructions: "Get your API key from DeepSeek platform. Optional - AI features will be disabled if not provided."
  },
  {
    name: "DEEPSEEK_BASE_URL",
    description: "Base URL for DeepSeek API (optional, defaults to https://api.deepseek.com)",
    required: false,
    instructions: "Only set if using a custom DeepSeek endpoint. Default is the official API endpoint with /v1 suffix."
  },

];

export interface EnvVariable {
  name: string
  description: string
  instructions: string
  required: boolean
}

export function checkMissingEnvVars(): string[] {
  return ENV_VARIABLES.filter(envVar => envVar.required && !process.env[envVar.name]).map(envVar => envVar.name)
}