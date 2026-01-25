
import { spawn } from "child_process";

const CONCURRENT_REQUESTS = 10;
const TOTAL_REQUESTS = 20;
const ENDPOINT = "http://localhost:3000/api/readings/interpret";

const MOCK_PAYLOAD = {
  question: "What does the future hold?",
  spreadId: "sentence-3",
  cards: [
    { id: 1, name: "Rider", position: 0 },
    { id: 2, name: "Clover", position: 1 },
    { id: 3, name: "Ship", position: 2 }
  ],
  _fallback: true // Use fallback to get full JSON response for easier timing measurement
};

async function makeRequest(id: number) {
  const start = performance.now();
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(MOCK_PAYLOAD),
    });

    const ttfb = performance.now();
    const data = await response.json();
    const end = performance.now();

    return {
      id,
      success: response.ok,
      status: response.status,
      ttfb: ttfb - start,
      duration: end - start,
      error: response.ok ? null : JSON.stringify(data)
    };
  } catch (error) {
    return {
      id,
      success: false,
      status: 0,
      ttfb: 0,
      duration: performance.now() - start,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function runLoadTest() {
  console.log(`Starting load test against ${ENDPOINT}`);
  console.log(`Concurrent Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  
  const results: any[] = [];
  const queue = Array.from({ length: TOTAL_REQUESTS }, (_, i) => i);
  const active: Promise<any>[] = [];

  const startTime = performance.now();

  while (queue.length > 0 || active.length > 0) {
    while (queue.length > 0 && active.length < CONCURRENT_REQUESTS) {
      const id = queue.shift()!;
      const p = makeRequest(id).then(res => {
        results.push(res);
        active.splice(active.indexOf(p), 1);
      });
      active.push(p);
    }
    
    if (active.length > 0) {
      await Promise.race(active);
    }
  }

  const totalTime = performance.now() - startTime;
  
  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const avgDuration = successful.reduce((acc, r) => acc + r.duration, 0) / successful.length;
  const avgTTFB = successful.reduce((acc, r) => acc + r.ttfb, 0) / successful.length;
  const p95Duration = successful.sort((a, b) => a.duration - b.duration)[Math.floor(successful.length * 0.95)]?.duration || 0;

  console.log("\n--- Load Test Results ---");
  console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Throughput: ${(successful.length / (totalTime / 1000)).toFixed(2)} req/s`);
  console.log(`Success Rate: ${((successful.length / TOTAL_REQUESTS) * 100).toFixed(1)}%`);
  console.log(`Avg Duration: ${avgDuration.toFixed(2)}ms`);
  console.log(`Avg TTFB: ${avgTTFB.toFixed(2)}ms`);
  console.log(`P95 Duration: ${p95Duration.toFixed(2)}ms`);
  
  if (failed.length > 0) {
    console.log("\nFailures:");
    failed.slice(0, 5).forEach(f => console.log(`Req ${f.id}: ${f.status} - ${f.error}`));
    if (failed.length > 5) console.log(`...and ${failed.length - 5} more`);
  }
}

// Wait for server to be ready (simple polling)
async function waitForServer() {
  console.log("Waiting for server to be ready...");
  for (let i = 0; i < 30; i++) {
    try {
      await fetch("http://localhost:3000");
      return true;
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

(async () => {
  if (await waitForServer()) {
    await runLoadTest();
  } else {
    console.error("Server did not start in time");
    process.exit(1);
  }
})();
