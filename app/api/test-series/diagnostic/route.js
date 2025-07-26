import { NextResponse } from "next/server";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
  };

  // Check 1: API Key Configuration
  diagnostics.checks.apiKey = {
    name: "Perplexity API Key",
    status: PERPLEXITY_API_KEY ? "✅ Configured" : "❌ Missing",
    details: {
      present: !!PERPLEXITY_API_KEY,
      length: PERPLEXITY_API_KEY ? PERPLEXITY_API_KEY.length : 0,
      masked: PERPLEXITY_API_KEY
        ? `${PERPLEXITY_API_KEY.substring(
            0,
            8
          )}...${PERPLEXITY_API_KEY.substring(PERPLEXITY_API_KEY.length - 4)}`
        : null,
    },
  };

  // Check 2: API URL Configuration
  diagnostics.checks.apiUrl = {
    name: "Perplexity API URL",
    status: "✅ Configured",
    details: {
      url: PERPLEXITY_API_URL,
      hostname: new URL(PERPLEXITY_API_URL).hostname,
    },
  };

  // Check 3: Network Connectivity
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const startTime = Date.now();
    const response = await fetch(PERPLEXITY_API_URL, {
      method: "HEAD",
      signal: controller.signal,
    });
    const responseTime = Date.now() - startTime;

    clearTimeout(timeoutId);

    diagnostics.checks.connectivity = {
      name: "Network Connectivity",
      status: response.ok ? "✅ Connected" : `⚠️ HTTP ${response.status}`,
      details: {
        httpStatus: response.status,
        responseTime: `${responseTime}ms`,
        headers: Object.fromEntries(response.headers.entries()),
      },
    };
  } catch (error) {
    diagnostics.checks.connectivity = {
      name: "Network Connectivity",
      status: "❌ Failed",
      details: {
        error: error.message,
        code: error.code,
        type: error.name,
      },
    };
  }

  // Check 4: Simple API Test (if API key is present)
  if (PERPLEXITY_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const testResponse = await fetch(PERPLEXITY_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            { role: "user", content: "Test connectivity - respond with 'OK'" },
          ],
          max_tokens: 10,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (testResponse.ok) {
        const testData = await testResponse.json();
        diagnostics.checks.apiTest = {
          name: "API Authentication Test",
          status: "✅ Working",
          details: {
            httpStatus: testResponse.status,
            responseLength: JSON.stringify(testData).length,
            model: testData.model || "unknown",
          },
        };
      } else {
        const errorText = await testResponse.text();
        diagnostics.checks.apiTest = {
          name: "API Authentication Test",
          status: `❌ HTTP ${testResponse.status}`,
          details: {
            httpStatus: testResponse.status,
            error: errorText.substring(0, 200),
          },
        };
      }
    } catch (error) {
      diagnostics.checks.apiTest = {
        name: "API Authentication Test",
        status: "❌ Failed",
        details: {
          error: error.message,
          code: error.code,
        },
      };
    }
  } else {
    diagnostics.checks.apiTest = {
      name: "API Authentication Test",
      status: "⏭️ Skipped",
      details: {
        reason: "No API key configured",
      },
    };
  }

  // Overall status
  const failedChecks = Object.values(diagnostics.checks).filter((check) =>
    check.status.includes("❌")
  ).length;

  diagnostics.overall = {
    status:
      failedChecks === 0
        ? "✅ All systems operational"
        : `❌ ${failedChecks} issues detected`,
    summary: {
      total: Object.keys(diagnostics.checks).length,
      passed: Object.values(diagnostics.checks).filter((check) =>
        check.status.includes("✅")
      ).length,
      failed: failedChecks,
      warnings: Object.values(diagnostics.checks).filter((check) =>
        check.status.includes("⚠️")
      ).length,
    },
  };

  return NextResponse.json(diagnostics, {
    status: failedChecks === 0 ? 200 : 503,
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
    },
  });
}
