export function getSwaggerHtml(specUrl: string): string {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SaaS Sénégal API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #fafafa; }
      .topbar { display: none; }
      #fallback {
        font-family: Arial, sans-serif;
        margin: 24px;
        padding: 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: white;
      }
      #fallback pre {
        overflow: auto;
        max-height: 60vh;
        background: #f8fafc;
        padding: 12px;
        border-radius: 6px;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <div id="fallback">
      <h2>Documentation API</h2>
      <p>Swagger UI n'a pas pu se charger (accès internet/CDN bloqué). Vous pouvez consulter la spec OpenAPI ci-dessous.</p>
      <p><a href="${specUrl}" target="_blank" rel="noreferrer">Ouvrir le fichier OpenAPI</a></p>
      <pre id="spec-content">Chargement...</pre>
    </div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      (function () {
        const fallback = document.getElementById('fallback');
        const specContent = document.getElementById('spec-content');

        fetch('${specUrl}')
          .then((r) => r.text())
          .then((txt) => { specContent.textContent = txt; })
          .catch(() => { specContent.textContent = 'Impossible de charger la spec OpenAPI.'; });

        if (typeof SwaggerUIBundle === 'function') {
          fallback.style.display = 'none';
          window.ui = SwaggerUIBundle({
            url: '${specUrl}',
            dom_id: '#swagger-ui',
            deepLinking: true,
            persistAuthorization: true,
          });
        }
      })();
    </script>
  </body>
</html>`;
}
