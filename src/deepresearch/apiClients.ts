import { createTogetherAI } from "@ai-sdk/togetherai";
import Together from "together-ai";
import Exa from "exa-js";

import { unstable_cache } from "next/cache";
import { SearchResult } from "./schemas";

export const togetheraiClient = createTogetherAI({
  apiKey: process.env.TOGETHER_API_KEY ?? "",
});

export const togetherai = new Together({
  apiKey: process.env.TOGETHER_API_KEY ?? "",
});

const exa = new Exa(process.env.EXA_API_KEY);

type SearchResults = {
  results: SearchResult[];
};

export const searchOnExa = async ({
  query,
}: {
  query: string;
}): Promise<SearchResults> => {
  try {
    const search = await unstable_cache(
      async () => {
        return await exa.searchAndContents(query, {
          type: "keyword",
          text: true,
          numResults: 5,
        });
      },
      [`exa-search-${query}`],
      {
        revalidate: 3600, // Cache for 1 hour
        tags: ["exa-search"],
      }
    )();

    const results = search.results.map((result) => {
      return {
        title: result.title || "",
        link: result.url,
        content: result.text,
      };
    });

    return {
      results,
    };
  } catch (e) {
    throw new Error(`Exa web search API error: ${e}`);
  }
};
