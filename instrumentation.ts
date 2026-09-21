export function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  console.info("deployment", {
    sha: process.env.RAILWAY_GIT_COMMIT_SHA,
    deploymentId: process.env.RAILWAY_DEPLOYMENT_ID,
  });
}
