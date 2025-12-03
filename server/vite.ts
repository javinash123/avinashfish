import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import { injectMetaTagsIntoHtml } from "./og-meta";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server, storage?: any) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      
      // Inject environment variables into window.RUNTIME_CONFIG for client-side access
      const runtimeConfig = {
        VITE_STRIPE_PUBLIC_KEY: process.env.VITE_STRIPE_PUBLIC_KEY || '',
      };
      const configScript = `<script>window.RUNTIME_CONFIG = ${JSON.stringify(runtimeConfig)};</script>`;
      template = template.replace('</head>', `${configScript}</head>`);
      
      const urlObj = new URL(url, `http://${req.headers.host}`);
      const articleId = urlObj.searchParams.get('article');
      const basePath = process.env.EXPRESS_BASE_PATH || '';
      const pathWithoutBase = basePath ? url.replace(basePath, '') : url;
      
      if (pathWithoutBase.startsWith('/news') && articleId && storage) {
        try {
          const article = await storage.getNews(articleId);
          if (article) {
            const baseUrl = `${req.protocol}://${req.headers.host}`;
            let imageUrl = article.image || '';
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            }
            
            template = injectMetaTagsIntoHtml(template, {
              title: article.title,
              description: article.excerpt || article.content?.substring(0, 160) || '',
              image: imageUrl,
              url: `${baseUrl}/news?article=${articleId}`,
              type: 'article',
              siteName: 'Peg Slam',
            });
          }
        } catch (err) {
          log(`Error fetching news article for OG meta: ${err}`);
        }
      }
      
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express, storage?: any) {
  const distPath = path.resolve(import.meta.dirname, "public");
  const basePath = process.env.EXPRESS_BASE_PATH || '';

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(basePath, express.static(distPath));

  app.use(`${basePath}/*`, async (req, res) => {
    const url = req.originalUrl;
    const indexPath = path.resolve(distPath, "index.html");
    
    try {
      let template = await fs.promises.readFile(indexPath, "utf-8");
      
      // Inject environment variables into window.RUNTIME_CONFIG for client-side access
      const runtimeConfig = {
        VITE_STRIPE_PUBLIC_KEY: process.env.VITE_STRIPE_PUBLIC_KEY || '',
      };
      const configScript = `<script>window.RUNTIME_CONFIG = ${JSON.stringify(runtimeConfig)};</script>`;
      template = template.replace('</head>', `${configScript}</head>`);
      
      const urlObj = new URL(url, `http://${req.headers.host}`);
      const articleId = urlObj.searchParams.get('article');
      const pathWithoutBase = basePath ? url.replace(basePath, '') : url;
      
      if (pathWithoutBase.startsWith('/news') && articleId && storage) {
        try {
          const article = await storage.getNews(articleId);
          if (article) {
            const baseUrl = `${req.protocol}://${req.headers.host}`;
            let imageUrl = article.image || '';
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            }
            
            template = injectMetaTagsIntoHtml(template, {
              title: article.title,
              description: article.excerpt || article.content?.substring(0, 160) || '',
              image: imageUrl,
              url: `${baseUrl}/news?article=${articleId}`,
              type: 'article',
              siteName: 'Peg Slam',
            });
          }
        } catch (err) {
          log(`Error fetching news article for OG meta: ${err}`);
        }
      }
      
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      res.sendFile(indexPath);
    }
  });
}
