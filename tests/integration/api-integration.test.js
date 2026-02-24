// tests/integration/api-integration.test.js
// Integration tests for the production La Tanda API

const http = require("http");

const API_BASE = "http://127.0.0.1:3002";

// Helper function to make HTTP requests
function makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const reqOptions = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: options.method || "GET",
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        };

        const req = http.request(reqOptions, (res) => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: JSON.parse(body)
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, headers: res.headers, body });
                }
            });
        });

        req.on("error", reject);
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        req.end();
    });
}

describe("La Tanda API Integration Tests", () => {
    describe("Health & System Endpoints", () => {
        test("GET /health returns online status", async () => {
            const res = await makeRequest("/health");
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe("online");
        });

        test("GET /api/system/status returns system info", async () => {
            const res = await makeRequest("/api/system/status");
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe("Security Headers", () => {
        test("All responses include security headers", async () => {
            const res = await makeRequest("/health");
            expect(res.headers["x-content-type-options"]).toBe("nosniff");
            expect(res.headers["x-frame-options"]).toBe("DENY");
            expect(res.headers["x-xss-protection"]).toBe("1; mode=block");
            expect(res.headers["strict-transport-security"]).toContain("max-age=");
            expect(res.headers["content-security-policy"]).toBeDefined();
            expect(res.headers["referrer-policy"]).toBeDefined();
            expect(res.headers["permissions-policy"]).toBeDefined();
        });
    });

    describe("Authentication Endpoints", () => {
        test("POST /api/auth/login without body returns 400", async () => {
            const res = await makeRequest("/api/auth/login", {
                method: "POST",
                body: {}
            });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test("POST /api/auth/login with invalid credentials returns 401", async () => {
            const res = await makeRequest("/api/auth/login", {
                method: "POST",
                body: { email: "nonexistent@test.com", password: "wrongpass" }
            });
            expect([400, 401]).toContain(res.status);
            expect(res.body.success).toBe(false);
        });

        test("GET /api/user/profile without auth returns 401", async () => {
            const res = await makeRequest("/api/user/profile");
            expect([400, 401]).toContain(res.status);
        });
    });

    describe("Admin Endpoints Protection", () => {
        test("GET /api/admin/dashboard/stats without auth returns 401", async () => {
            const res = await makeRequest("/api/admin/dashboard/stats");
            expect([400, 401]).toContain(res.status);
        });

        test("GET /api/admin/audit-logs without auth returns 401", async () => {
            const res = await makeRequest("/api/admin/audit-logs");
            expect([400, 401]).toContain(res.status);
        });
    });

    describe("404 Handling", () => {
        test("Non-existent endpoint returns 404", async () => {
            const res = await makeRequest("/api/nonexistent/endpoint");
            expect(res.status).toBe(404);
        });
    });
});
