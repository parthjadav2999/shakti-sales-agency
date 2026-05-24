import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/shakti-sales-agency/',
  plugins: [
    react(),
    {
      name: 'sync-html-middleware',
      configureServer(server) {
        server.middlewares.use('/api/sync-html', (req, res, next) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const { products, customers, invoices } = data;
                
                const htmlPath = path.resolve(__dirname, 'shakti_sales_agency.html');
                if (fs.existsSync(htmlPath)) {
                  let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
                  
                  if (products) {
                    const productsJson = JSON.stringify(products, null, 4);
                    htmlContent = htmlContent.replace(
                      /(\/\*START_PRODUCTS\*\/)[\s\S]*?(\/\*END_PRODUCTS\*\/)/,
                      `$1${productsJson}$2`
                    );
                  }
                  
                  if (customers) {
                    const customersJson = JSON.stringify(customers, null, 4);
                    htmlContent = htmlContent.replace(
                      /(\/\*START_CUSTOMERS\*\/)[\s\S]*?(\/\*END_CUSTOMERS\*\/)/,
                      `$1${customersJson}$2`
                    );
                  }
                  
                  if (invoices) {
                    const invoicesJson = JSON.stringify(invoices, null, 4);
                    htmlContent = htmlContent.replace(
                      /(\/\*START_INVOICES\*\/)[\s\S]*?(\/\*END_INVOICES\*\/)/,
                      `$1${invoicesJson}$2`
                    );
                  }
                  
                  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
                  console.log('[Sync Server] Successfully synchronized standalone HTML database on disk!');
                }
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                console.error('[Sync Server] Sync failed:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
  server: {
    host: true,
  },
  optimizeDeps: {
    include: ['jspdf'],
  },
})
