const http = require("http");

// Test parameters
const iterations = 100; // 100 requests
const concurrency = 10; // 10 concurrent requests
let completed = 0;
let failed = 0;
let totalResponseTime = 0;
const startTime = Date.now();

const testPayload = JSON.stringify({
  question: "What does the future hold for my love life?",
  cards: [
    { id: 1, name: "Rider" },
    { id: 24, name: "Heart" },
    { id: 6, name: "Clouds" },
  ],
  spreadId: "sentence-3",
  _fallback: true,
});

function makeRequest() {
  const requestStart = Date.now();

  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 4000,
      path: "/api/readings/interpret",
      method: "POST",
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": testPayload.length,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        const responseTime = Date.now() - requestStart;
        totalResponseTime += responseTime;
        completed++;
        resolve(true);
      });
    });

    req.on("error", (e) => {
      failed++;
      resolve(false);
    });

    req.on("timeout", () => {
      req.destroy();
      failed++;
      resolve(false);
    });

    req.write(testPayload);
    req.end();
  });
}

async function runTest() {
  console.log(
    `\n🚀 Performance Test: ${iterations} requests with concurrency=${concurrency}\n`,
  );
  const cpuSamples = [];

  for (let batch = 0; batch < iterations; batch += concurrency) {
    const batchSize = Math.min(concurrency, iterations - batch);
    const promises = [];

    for (let i = 0; i < batchSize; i++) {
      promises.push(makeRequest());
    }

    await Promise.all(promises);
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const avgResponseTime = (totalResponseTime / completed).toFixed(0);
  const rps = (completed / totalTime).toFixed(2);

  console.log(`✅ Performance Test Results:`);
  console.log(`   Total Time: ${totalTime.toFixed(2)}s`);
  console.log(`   Completed: ${completed}/${iterations}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Throughput: ${rps} requests/second`);
  console.log(`   Avg Response Time: ${avgResponseTime}ms`);
  console.log(
    `   Success Rate: ${((completed / iterations) * 100).toFixed(1)}%\n`,
  );

  process.exit(0);
}

runTest().catch(console.error);
