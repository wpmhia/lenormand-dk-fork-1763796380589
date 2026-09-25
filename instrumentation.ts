export function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const version = process.env.RAILWAY_GIT_COMMIT_SHA
    ?? process.env.OTEL_SERVICE_VERSION
    ?? process.env.GIT_COMMIT_SHA
    ?? process.env.SOURCE_VERSION
    ?? process.env.VERCEL_GIT_COMMIT_SHA
    ?? process.env.RAILWAY_DEPLOYMENT_ID;

  console.info("deployment", {
    version,
    sha: process.env.RAILWAY_GIT_COMMIT_SHA,
    deploymentId: process.env.RAILWAY_DEPLOYMENT_ID,
  });
}
