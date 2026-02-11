// Simulate the chunk parsing issue

const sampleChunks = [
  "data: {\"type\":\"chunk\",\"content\":\"Mah \"}\n\n",
  "data: {\"type\":\"chunk\",\"content\":\"day \"}\n\n",
  "data: {\"type\":\"chunk\",\"content\":\"under \"}\n\n",
  "data: {\"type\":\"chunk\",\"content\":\"influence \"}\n\n",
];

function parseChunks(rawData) {
  let fullReading = "";
  const lines = rawData.split("\n");
  
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6);
      
      if (data === "[DONE]") continue;
      
      try {
        const parsed = JSON.parse(data);
        
        if (parsed.type === "chunk" && parsed.content) {
          fullReading += parsed.content;
          console.log("Added chunk:", JSON.stringify(parsed.content), "Total:", JSON.stringify(fullReading));
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.log("Skipped JSON parse error for:", JSON.stringify(data));
        } else {
          throw e;
        }
      }
    }
  }
  
  return fullReading;
}

// Test concatenation
const combined = sampleChunks.join("");
console.log("\nCombined chunks:");
console.log(combined);

console.log("\nParsing result:");
const result = parseChunks(combined);
console.log("Final reading:", JSON.stringify(result));
