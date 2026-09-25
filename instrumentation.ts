export function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const version = process.env.RAILWAY_GIT_COMMIT_SHA
    ?? process.env.OTEL_SERVICE_VERSION
    ?? process.env.RAILWAY_DEPLOYMENT_ID;

  console.info("deployment", JSON.stringify({
    version,
    deploymentId: process.env.RAILWAY_DEPLOYMENT_ID,
  }));
}
