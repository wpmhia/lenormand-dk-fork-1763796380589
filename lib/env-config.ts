// IMPORTANT: When adding new env variables to the codebase, update this array
export const ENV_VARIABLES: EnvVariable[] = [
  {
    name: "DEEPSEEK_API_KEY",
    description:
      "API key for DeepSeek AI service for Lenormand reading interpretations",
    required: false,
    instructions:
      "Get your API key from DeepSeek platform. Optional - AI features will be disabled if not provided.",
  },
  {
    name: "DEEPSEEK_BASE_URL",
    description:
      "Base URL for DeepSeek API (optional, defaults to https://api.deepseek.com)",
    required: false,
    instructions:
      "Only set if using a custom DeepSeek endpoint. Default is the official API endpoint with /v1 suffix.",
  },
  {
    name: "DATABASE_URL",
    description: "Neon PostgreSQL database connection string",
    required: true,
    instructions:
      "Get this from Neon Dashboard > Project > Connection string. Format: postgresql://user:password@host/dbname?sslmode=require",
  },
  {
    name: "NEXTAUTH_SECRET",
    description: "Secret key for NextAuth.js authentication",
    required: true,
    instructions:
      "Generate with: openssl rand -base64 32 or use any random string",
  },
  {
    name: "NEXTAUTH_URL",
    description: "Base URL of your application",
    required: true,
    instructions:
      "Use http://localhost:3000 for development, your domain for production",
  },
  {
    name: "EMAIL_SERVER_HOST",
    description:
      "SMTP server host for email authentication (e.g., smtp.gmail.com)",
    required: false,
    instructions:
      "Required only if using email provider. See your email provider's SMTP settings.",
  },
  {
    name: "EMAIL_SERVER_PORT",
    description: "SMTP server port (e.g., 587 for TLS)",
    required: false,
    instructions: "Common ports: 587 (TLS), 465 (SSL)",
  },
  {
    name: "EMAIL_SERVER_USER",
    description: "SMTP username/email",
    required: false,
    instructions: "Your email address for SMTP authentication",
  },
  {
    name: "EMAIL_SERVER_PASSWORD",
    description: "SMTP password or app-specific token",
    required: false,
    instructions:
      "Your email password or app-specific token (e.g., Gmail app password)",
  },
  {
    name: "EMAIL_FROM",
    description: "From email address for auth emails",
    required: false,
    instructions: "The email address that sends authentication emails",
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
