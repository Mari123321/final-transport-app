/**
 * API Endpoint Test Script
 * 
 * Tests the /api/smart-payments/bill-dates endpoint directly
 */

import http from "http";

function testAPI(clientId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path: `/api/smart-payments/bill-dates?clientId=${clientId}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log(`\nStatus: ${res.statusCode}`);
        console.log("Headers:", res.headers);
        console.log("\nResponse Body:");
        
        try {
          const parsed = JSON.parse(data);
          console.log(JSON.stringify(parsed, null, 2));
          resolve(parsed);
        } catch (e) {
          console.log(data);
          resolve(data);
        }
      });
    });

    req.on("error", (error) => {
      console.error("Request error:", error);
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  console.log("=== Testing Smart Payments API ===\n");

  // Test 1: With valid client ID
  console.log("Test 1: GET /api/smart-payments/bill-dates?clientId=1");
  await testAPI(1);

  // Test 2: Without client ID
  console.log("\n\nTest 2: GET /api/smart-payments/bill-dates (no clientId)");
  await testAPI("");

  console.log("\n\n✅ All tests completed!");
}

// Run tests
runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
