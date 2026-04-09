import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.message) message = errorJson.message;
    } catch {
      // not JSON — use raw text
    }
    throw new Error(message);
  }

  return response.json();
}