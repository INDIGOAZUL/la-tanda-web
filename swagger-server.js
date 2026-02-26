const express = require("express");
const swaggerUi = require("swagger-ui-express");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.SWAGGER_PORT || 3004;

// Load OpenAPI spec from YAML
let swaggerDocument;
try {
  const yamlPath = path.join(__dirname, "openapi.yaml");
  swaggerDocument = yaml.load(fs.readFileSync(yamlPath, "utf8"));
  console.log("✅ OpenAPI spec loaded from openapi.yaml");
} catch (err) {
  console.error("❌ Error loading OpenAPI spec:", err.message);
  process.exit(1);
}

// Swagger UI options
const swaggerOptions = {
  customSiteTitle: "La Tanda API Documentation",
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .info .title { color: #3b82f6 }
  `,
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    filter: true,
    displayRequestDuration: true,
    supportedSubmitMethods: []
  }
};

// Serve Swagger UI at /docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Redirect root to /docs
app.get("/", (req, res) => {
  res.redirect("/docs");
});

// Serve the raw OpenAPI spec as JSON
app.get("/api-spec", (req, res) => {
  res.json(swaggerDocument);
});

// Serve the raw OpenAPI spec as YAML
app.get("/api-spec.yaml", (req, res) => {
  res.type("text/yaml").send(fs.readFileSync(path.join(__dirname, "openapi.yaml"), "utf8"));
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "swagger-docs",
    endpoints_documented: Object.keys(swaggerDocument.paths || {}).length,
    version: swaggerDocument.info?.version
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`📚 Swagger Documentation Server running on port ${PORT}`);
  console.log(`📖 Documentation: http://localhost:${PORT}/docs`);
  console.log(`📄 OpenAPI JSON: http://localhost:${PORT}/api-spec`);
  console.log(`📄 OpenAPI YAML: http://localhost:${PORT}/api-spec.yaml`);
});
