import fs from "fs";
import path from "path";

interface OGMetaData {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: string;
  siteName?: string;
}

const DEFAULT_META: OGMetaData = {
  title: "Peg Slam - UK Fishing Competitions",
  description: "UK's premier fishing competition platform. Book pegs, view live leaderboards, and join exciting match fishing events across the UK.",
  url: "",
  type: "website",
  siteName: "Peg Slam",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateOGMetaTags(meta: OGMetaData): string {
  const title = escapeHtml(meta.title || DEFAULT_META.title);
  const description = escapeHtml(meta.description || DEFAULT_META.description);
  const siteName = escapeHtml(meta.siteName || DEFAULT_META.siteName || "Peg Slam");
  const type = escapeHtml(meta.type || "article");
  const url = escapeHtml(meta.url);
  const image = escapeHtml(meta.image || "");

  let tags = `
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="${siteName}" />`;

  if (image) {
    tags += `
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />`;
  }

  tags += `
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />`;

  if (image) {
    tags += `
    <meta name="twitter:image" content="${image}" />`;
  }

  return tags;
}

export function injectMetaTagsIntoHtml(html: string, meta: OGMetaData): string {
  const ogTags = generateOGMetaTags(meta);
  
  const titleTag = `<title>${escapeHtml(meta.title)} | Peg Slam</title>`;
  const descriptionTag = `<meta name="description" content="${escapeHtml(meta.description)}" />`;
  
  let modifiedHtml = html.replace(
    /<title>.*?<\/title>/,
    titleTag
  );
  
  modifiedHtml = modifiedHtml.replace(
    /<meta name="description"[^>]*>/,
    descriptionTag
  );
  
  modifiedHtml = modifiedHtml.replace(
    "</head>",
    `${ogTags}\n  </head>`
  );

  return modifiedHtml;
}

export async function getBaseHtml(isDev: boolean): Promise<string> {
  const htmlPath = isDev
    ? path.resolve(process.cwd(), "client", "index.html")
    : path.resolve(process.cwd(), "dist", "public", "index.html");
  
  return fs.promises.readFile(htmlPath, "utf-8");
}
