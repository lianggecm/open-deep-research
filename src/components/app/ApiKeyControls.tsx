"use client";

import { useEffect, useState, useRef } from "react";

import { toast } from "sonner";

// Custom hook to get Together API key from sessionStorage
export function useTogetherApiKey() {
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  useEffect(() => {
    setApiKey(sessionStorage.getItem("togetherApiKey") || undefined);
  }, []);
  return apiKey;
}

export function ApiKeyControls() {
  const [togetherApiKey, setTogetherApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedKey = sessionStorage.getItem("togetherApiKey") || "";
    setTogetherApiKey(storedKey);
  }, []);

  const validateAndSaveApiKey = async (apiKey: string) => {
    setIsValidating(true);
    try {
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      });

      if (response.ok) {
        sessionStorage.setItem("togetherApiKey", apiKey);
        toast.success("API key validated and saved!");
        return true;
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData.message ||
          `API key validation failed with status: ${response.status}`;
        toast.error(errorMessage);

        if (errorMessage.startsWith("Invalid API key")) {
          sessionStorage.removeItem("togetherApiKey");
          setTogetherApiKey("");
        }
        return false;
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleApiKeyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTogetherApiKey(value);

    if (value.length === 0) {
      sessionStorage.removeItem("togetherApiKey");
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      await validateAndSaveApiKey(value);
    }, 500); // Debounce for 500ms
  };

  return (
    <div className="flex flex-col gap-3 w-full px-4 pb-2 border-t border-t-[#E5E7EB] pt-5">
      <p className="text-sm text-[#4a5565]">[optional] Together API key</p>
      <div className="flex flex-col gap-1 rounded border border-[#d1d5dc] bg-white p-3 relative">
        <input
          type="password"
          placeholder="*********************"
          className="text-sm text-[#4a5565] outline-none placeholder-[#d1d5dc] bg-transparent border-none focus:ring-0 p-0"
          value={togetherApiKey}
          onChange={handleApiKeyChange}
          autoComplete="off"
        />
        {isValidating && (
          <img
            src="/loading.svg"
            className="text-xs absolute right-3 top-1/2 -translate-y-1/2 animate-spin"
          />
        )}
      </div>

      <p className="text-xs font-light text-left">
        <span className="text-[#99a1af]">Don't have an API key? </span>
        <a
          href="https://api.together.xyz/settings/api-keys"
          className="text-[#6a7282] underline underline-offset-2"
        >
          Get one for free.
        </a>
      </p>
    </div>
  );
}
