export function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const sha = process.env.RAILWAY_GIT_COMMIT_SHA
    ?? process.env.GIT_COMMIT_SHA
    ?? process.env.SOURCE_VERSION
    ?? process.env.VERCEL_GIT_COMMIT_SHA;

  console.info("deployment", {
    sha,
    deploymentId: process.env.RAILWAY_DEPLOYMENT_ID,
  });
}
