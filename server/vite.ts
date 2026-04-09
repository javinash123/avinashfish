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

function resolveImageUrl(imageUrl: string, baseUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

async function injectOgTagsForRoute(req: any, url: string, template: string, storage: any): Promise<string> {
  if (!storage) return template;
  const basePath = process.env.EXPRESS_BASE_PATH || '';
  const cleanPath = (basePath ? url.replace(basePath, '') : url).split('?')[0];
  const baseUrl = `${req.protocol}://${req.headers.host}`;

  try {
    // /news/:id  (e.g. /news/abc123)
    const newsPathMatch = cleanPath.match(/^\/news\/([^/]+)$/);
    if (newsPathMatch) {
      const article = await storage.getNews(newsPathMatch[1]);
      if (article) {
        return injectMetaTagsIntoHtml(template, {
          title: article.title,
          description: article.excerpt || (article.content || '').replace(/<[^>]*>/g, '').substring(0, 160),
          image: resolveImageUrl(article.image || '', baseUrl),
          url: `${baseUrl}/news/${newsPathMatch[1]}`,
          type: 'article',
          siteName: 'Peg Slam',
        });
      }
    }

    // /news?article=xxx  (legacy query param style)
    const urlObj = new URL(url, `http://${req.headers.host}`);
    const articleId = urlObj.searchParams.get('article');
    if (cleanPath.startsWith('/news') && articleId) {
      const article = await storage.getNews(articleId);
      if (article) {
        return injectMetaTagsIntoHtml(template, {
          title: article.title,
          description: article.excerpt || (article.content || '').replace(/<[^>]*>/g, '').substring(0, 160),
          image: resolveImageUrl(article.image || '', baseUrl),
          url: `${baseUrl}/news/${articleId}`,
          type: 'article',
          siteName: 'Peg Slam',
        });
      }
    }

    // /competition/:id
    const compPathMatch = cleanPath.match(/^\/competition\/([^/]+)$/);
    if (compPathMatch) {
      const competition = await storage.getCompetition(compPathMatch[1]);
      if (competition) {
        return injectMetaTagsIntoHtml(template, {
          title: competition.name,
          description: `${competition.venue} — ${competition.date}. Entry fee: ${competition.entryFee}. Book your peg now on Peg Slam.`,
          image: resolveImageUrl(competition.imageUrl || competition.thumbnailUrl || '', baseUrl),
          url: `${baseUrl}/competition/${compPathMatch[1]}`,
          type: 'website',
          siteName: 'Peg Slam',
        });
      }
    }

    // /profile/:username
    const profilePathMatch = cleanPath.match(/^\/profile\/([^/]+)$/);
    if (profilePathMatch && storage.getUserByUsername) {
      const user = await storage.getUserByUsername(profilePathMatch[1]);
      if (user) {
        const name = `${user.firstName} ${user.lastName}`.trim() || user.username;
        return injectMetaTagsIntoHtml(template, {
          title: `${name} — Angler Profile`,
          description: user.bio || `View ${name}'s angler profile, competition history, and achievements on Peg Slam.`,
          image: resolveImageUrl(user.avatar || '', baseUrl),
          url: `${baseUrl}/profile/${profilePathMatch[1]}`,
          type: 'profile',
          siteName: 'Peg Slam',
        });
      }
    }

    // /gallery?id=xxx
    const galleryId = urlObj.searchParams.get('id');
    if (cleanPath.startsWith('/gallery') && galleryId && storage.getGalleryImage) {
      const image = await storage.getGalleryImage(galleryId);
      if (image) {
        const imageUrl = image.urls && image.urls.length > 0
          ? resolveImageUrl(image.urls[0].replace('-optimized.webp', ''), baseUrl)
          : '';
        const desc = [image.description, image.angler ? `Angler: ${image.angler}` : '', image.competition || '']
          .filter(Boolean).join(' | ').substring(0, 160);
        return injectMetaTagsIntoHtml(template, {
          title: image.title,
          description: desc || `Gallery photo from Peg Slam — ${image.date}`,
          image: imageUrl,
          url: `${baseUrl}/gallery?id=${galleryId}`,
          type: 'website',
          siteName: 'Peg Slam',
        });
      }
    }
  } catch (err) {
    log(`Error injecting OG meta tags: ${err}`);
  }

  return template;
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
      
      template = await injectOgTagsForRoute(req, url, template, storage);
      
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
      
      template = await injectOgTagsForRoute(req, url, template, storage);
      
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      res.sendFile(indexPath);
    }
  });
}
