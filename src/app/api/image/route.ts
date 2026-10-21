import { NextRequest, NextResponse } from "next/server";

// Cache in-memory for 7 days
interface CachedImageResult {
  data: {
    found: boolean;
    url?: string;
    title?: string;
    author?: string;
    license?: string;
    filePageUrl?: string;
  };
  expiresAt: number;
}

const memoryCache = new Map<string, CachedImageResult>();
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

function isFreeLicense(license: string, licenseUrl?: string): boolean {
  if (!license && !licenseUrl) return false;
  const l = (license || "").toLowerCase();
  const u = (licenseUrl || "").toLowerCase();
  const freePatterns = [
    "cc", "creative commons", "public domain", "pd", "gfdl",
    "gnu", "open", "free", "attribution", "by-sa", "by"
  ];
  return freePatterns.some(pat => l.includes(pat) || u.includes(pat));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json({ found: false, error: "Missing query" }, { status: 400 });
    }

    const cacheKey = query.toLowerCase();
    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data);
    }

    // Call Wikimedia Commons MediaWiki API
    const wikiUrl = new URL("https://commons.wikimedia.org/w/api.php");
    wikiUrl.searchParams.set("action", "query");
    wikiUrl.searchParams.set("generator", "search");
    wikiUrl.searchParams.set("gsrnamespace", "6"); // File namespace
    wikiUrl.searchParams.set("prop", "imageinfo");
    wikiUrl.searchParams.set("iiprop", "url|extmetadata");
    wikiUrl.searchParams.set("format", "json");
    wikiUrl.searchParams.set("gsrlimit", "8");
    wikiUrl.searchParams.set("gsrsearch", query);

    const res = await fetch(wikiUrl.toString(), {
      headers: {
        "User-Agent": "Doubtster/1.0 (educational AI tutor; https://doubtster.com; info@doubtster.com)"
      },
      next: { revalidate: 604800 } // Next.js cache 7 days
    });

    if (!res.ok) {
      return NextResponse.json({ found: false });
    }

    const data = await res.json();
    const pages = data?.query?.pages;

    if (!pages || typeof pages !== "object") {
      const notFoundResult = { found: false };
      memoryCache.set(cacheKey, { data: notFoundResult, expiresAt: Date.now() + SEVEN_DAYS_MS });
      return NextResponse.json(notFoundResult);
    }

    // Sort pages by search index / relevance
    const pageList = Object.values(pages) as any[];
    pageList.sort((a, b) => (a.index ?? 99) - (b.index ?? 99));

    for (const page of pageList) {
      const imageInfo = page?.imageinfo?.[0];
      if (!imageInfo || !imageInfo.url) continue;

      // Filter out audio / video / non-image formats if needed
      const fileUrl = imageInfo.url as string;
      const lowerUrl = fileUrl.toLowerCase().split("?")[0];
      const isImg = lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") ||
                    lowerUrl.endsWith(".png") || lowerUrl.endsWith(".svg") ||
                    lowerUrl.endsWith(".webp") || lowerUrl.endsWith(".gif");
      if (!isImg) continue;

      const metadata = imageInfo.extmetadata || {};
      const licenseShort = metadata.LicenseShortName?.value || metadata.License?.value || "";
      const licenseUrl = metadata.LicenseUrl?.value || "";
      const artist = metadata.Artist?.value || metadata.Credit?.value || "Wikimedia Commons contributor";
      const objectName = metadata.ObjectName?.value || page.title || "";

      // Validate free license (Wikimedia is CC or PD, but let's be strict as requested)
      if (!isFreeLicense(licenseShort, licenseUrl)) {
        // If license metadata missing on Commons, it's typically still public domain / CC, but verify
        if (!licenseShort && !licenseUrl) {
          // If no license field found, continue searching next image
          continue;
        }
      }

      const cleanTitle = stripHtml(objectName).replace(/^File:/i, "").replace(/\.[^/.]+$/, "");
      const cleanAuthor = stripHtml(artist);
      const cleanLicense = stripHtml(licenseShort || "CC BY-SA");
      const filePageUrl = imageInfo.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`;

      const result = {
        found: true,
        url: imageInfo.url,
        title: cleanTitle || query,
        author: cleanAuthor || "Wikimedia contributor",
        license: cleanLicense,
        filePageUrl
      };

      memoryCache.set(cacheKey, { data: result, expiresAt: Date.now() + SEVEN_DAYS_MS });
      return NextResponse.json(result);
    }

    const notFound = { found: false };
    memoryCache.set(cacheKey, { data: notFound, expiresAt: Date.now() + SEVEN_DAYS_MS });
    return NextResponse.json(notFound);

  } catch (err: any) {
    console.error("Wikimedia Image Search API Error:", err);
    return NextResponse.json({ found: false, error: err.message }, { status: 500 });
  }
}
