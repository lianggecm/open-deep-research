import { createTogetherAI } from "@ai-sdk/togetherai";
import Together from "together-ai";
import FirecrawlApp, { SearchResponse } from "@mendable/firecrawl-js";

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
  try {
    // Perform a basic search using Firecrawl
    const searchResult: SearchResponse = await app.search(query, {
      limit: 5,
      scrapeOptions: {
        formats: ["markdown"],
      },
    });

    const results = searchResult.data.map((result) => ({
      title: result.title || "",
      link: result.url || "",
      content: result.markdown || "",
    }));

    return { results };
  } catch (e) {
    throw new Error(`Firecrawl web search API error: ${e}`);
  }
};
