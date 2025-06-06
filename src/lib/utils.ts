import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// Function to clean markdown to pure text
export function cleanMarkdownToText(markdownText: string | undefined): string {
  if (!markdownText) {
    return "";
  }

  let cleanText = markdownText;

  // Remove headers
  cleanText = cleanText.replace(/^#+\s/gm, "");

  // Remove bold and italics
  cleanText = cleanText.replace(/(\*\*|__)(.*?)\1/g, "$2");
  cleanText = cleanText.replace(/(\*|_)(.*?)\1/g, "$2");

  // Remove links, keeping only the link text
  cleanText = cleanText.replace(/\[(.*?)\]\(.*?\)/g, "$1");

  // Remove images, keeping only the alt text
  cleanText = cleanText.replace(/!\[(.*?)\]\(.*?\)/g, "$1");

  // Remove blockquotes
  cleanText = cleanText.replace(/^>\s/gm, "");

  // Remove list markers
  cleanText = cleanText.replace(/^(\s*)[-*+]\s/gm, "$1");
  cleanText = cleanText.replace(/^(\s*)\d+\.\s/gm, "$1");

  // Remove horizontal rules
  cleanText = cleanText.replace(/^-{3,}\s*$/gm, "");
  cleanText = cleanText.replace(/^\*{3,}\s*$/gm, "");
  cleanText = cleanText.replace(/^__{3,}\s*$/gm, "");

  // Remove code blocks
  cleanText = cleanText.replace(/```[\s\S]*?```/g, "");
  cleanText = cleanText.replace(/`([^`]+)`/g, "$1");

  // Remove extra whitespace and newlines
  cleanText = cleanText.replace(/\s+/g, " ").trim();

  return cleanText;
}
