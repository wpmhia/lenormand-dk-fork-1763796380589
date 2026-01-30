const http = require("http");

// Test parameters
const iterations = 50; // 50 requests (reduced from 270 for faster testing)
const concurrency = 5; // 5 concurrent requests
let completed = 0;
let failed = 0;
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
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 4000,
      path: "/api/readings/interpret",
      method: "POST",
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
        completed++;
        resolve(true);
      });
    });

    req.on("error", () => {
      failed++;
      resolve(false);
    });

    req.write(testPayload);
    req.end();
  });
}

async function runTest() {
  console.log(
    `Starting performance test: ${iterations} requests with concurrency=${concurrency}\n`,
  );

  for (let batch = 0; batch < iterations; batch += concurrency) {
    const batchSize = Math.min(concurrency, iterations - batch);
    const promises = [];

    for (let i = 0; i < batchSize; i++) {
      promises.push(makeRequest());
    }

    await Promise.all(promises);

    if ((batch + batchSize) % 10 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rps = (completed / elapsed).toFixed(2);
      console.log(
        `Progress: ${completed}/${iterations} completed (${rps} req/s)`,
      );
    }
  }

  const totalTime = (Date.now() - startTime) / 1000;
  const rps = (completed / totalTime).toFixed(2);

  console.log(`\n✅ Test completed in ${totalTime.toFixed(2)}s`);
  console.log(`   Completed: ${completed}/${iterations}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Throughput: ${rps} requests/second`);

  process.exit(0);
}

runTest().catch(console.error);
