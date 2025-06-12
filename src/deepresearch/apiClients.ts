import { createTogetherAI } from "@ai-sdk/togetherai";
import Together from "together-ai";
import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";

import { unstable_cache } from "next/cache";
import { SearchResult } from "./schemas";

const APP_NAME_HELICONE = "deepresearch";

export const togetheraiClient = createTogetherAI({
  apiKey: process.env.TOGETHER_API_KEY ?? "",
  baseURL: "https://together.helicone.ai/v1",
  headers: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-Property-AppName": APP_NAME_HELICONE,
  },
});

// Dynamic TogetherAI client for client-side use
export function togetheraiClientWithKey(apiKey: string) {
  return createTogetherAI({
    apiKey: apiKey || process.env.TOGETHER_API_KEY || "",
    baseURL: "https://together.helicone.ai/v1",
    headers: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-AppName": APP_NAME_HELICONE,
    },
  });
}

export function togetheraiWithKey(apiKey: string) {
  const options: ConstructorParameters<typeof Together>[0] = {
    apiKey: apiKey || process.env.TOGETHER_API_KEY,
  };

  if (process.env.HELICONE_API_KEY) {
    options.baseURL = "https://together.helicone.ai/v1";
    options.defaultHeaders = {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-Appname": APP_NAME_HELICONE,
    };
  }
  return new Together(options);
}

const options: ConstructorParameters<typeof Together>[0] = {
  apiKey: process.env.TOGETHER_API_KEY,
};

if (process.env.HELICONE_API_KEY) {
  options.baseURL = "https://together.helicone.ai/v1";
  options.defaultHeaders = {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-Property-Appname": APP_NAME_HELICONE,
  };
}

export const togetherai = new Together(options);

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

type SearchResults = {
  results: SearchResult[];
};

export const searchOnWeb = async ({
  query,
}: {
  query: string;
}): Promise<SearchResults> => {
  // 1. Call Brave Search API for web results
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
      query
    )}&count=5&result_filter=web`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": process.env.BRAVE_API_KEY || "",
      } as HeadersInit,
    }
  );
  const responseJson = await res.json();
  const parsedResponseJson = z
    .object({
      web: z.object({
        results: z.array(
          z.object({
            url: z.string(),
            title: z.string(),
            meta_url: z.object({
              favicon: z.string(),
            }),
            extra_snippets: z.array(z.string()).default([]),
            thumbnail: z
              .object({
                original: z.string(),
              })
              .optional(),
          })
        ),
      }),
    })
    .parse(responseJson);

  const parsedResults = parsedResponseJson.web.results.map((r) => ({
    title: r.title,
    url: r.url,
    favicon: r.meta_url.favicon,
    extraSnippets: r.extra_snippets,
    thumbnail: r.thumbnail?.original,
  }));

  // 2. Validate and type results
  const searchResultSchema = z.object({
    title: z.string(),
    url: z.string(),
    favicon: z.string(),
    extraSnippets: z.array(z.string()).default([]),
    thumbnail: z.string().optional(),
  });
  type SearchResult = z.infer<typeof searchResultSchema>;
  const schema = z.array(searchResultSchema);
  const searchResults = schema.parse(parsedResults);

  // 3. Markdown stripping helper
  function stripUrlsFromMarkdown(markdown: string): string {
    let result = markdown;
    result = result.replace(
      /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)/g,
      "$1"
    );
    result = result.replace(
      /\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)/g,
      "$1"
    );
    result = result.replace(
      /^\[[^\]]+\]:\s*https?:\/\/[^\s]+(?:\s+"[^"]*")?$/gm,
      ""
    );
    result = result.replace(/<(https?:\/\/[^>]+)>/g, "");
    result = result.replace(/https?:\/\/[^\s]+/g, "");
    return result.trim();
  }

  // 4. Scrape each result with Firecrawl
  async function scrapeSearchResult(searchResult: SearchResult) {
    let scrapedText = "";
    let scrapeResponse: Awaited<ReturnType<typeof app.scrapeUrl>> | undefined;
    try {
      scrapeResponse = await app.scrapeUrl(searchResult.url, {
        formats: ["markdown"],
        timeout: 15000,
        // 12 hours
        maxAge: 12 * 60 * 60 * 1000,
      });
      if (scrapeResponse.error) {
        throw scrapeResponse.error;
      }
      if (scrapeResponse.success) {
        const rawText = scrapeResponse.markdown ?? "";
        scrapedText = stripUrlsFromMarkdown(rawText).substring(0, 80_000);
      }
    } catch (e) {
      // ignore individual scrape errors
      console.error("Error scraping", searchResult.url, " with error", e);
    }
    return {
      title: searchResult.title,
      link: searchResult.url,
      content: scrapedText,
    };
  }

  const resultsSettled = await Promise.allSettled(
    searchResults.map(scrapeSearchResult)
  );

  const results = resultsSettled
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<any>).value)
    .filter((r) => r.content !== "");

  if (results.length === 0) {
    return { results: [] };
  }
  return { results };
};
