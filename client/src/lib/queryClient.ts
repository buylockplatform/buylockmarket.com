import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Handle 204 No Content responses (no body to parse)
  if (res.status === 204) {
    console.log(`API Response for ${method} ${url}: No Content (204)`);
    return null;
  }
  
  // Parse JSON response for other successful responses
  const result = await res.json();
  console.log(`API Response for ${method} ${url}:`, result);
  return result;
}

// Vendor-specific API request function using session-based authentication
export async function vendorApiRequest(
  url: string,
  method: string = "GET",
  data?: unknown | undefined,
): Promise<any> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Include cookies for session-based auth
  });

  await throwIfResNotOk(res);
  
  // Handle 204 No Content responses (no body to parse)
  if (res.status === 204) {
    console.log(`Vendor API Response for ${method} ${url}: No Content (204)`);
    return null;
  }
  
  // Parse JSON response for other successful responses
  const result = await res.json();
  console.log(`Vendor API Response for ${method} ${url}:`, result);
  return result;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;
    
    // If there's a second element that's an object, treat it as query parameters
    if (queryKey.length > 1 && typeof queryKey[1] === 'object' && queryKey[1] !== null) {
      const params = new URLSearchParams();
      const queryParams = queryKey[1] as Record<string, any>;
      
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    } else if (queryKey.length > 1) {
      // Fallback: join with "/" for backward compatibility
      url = queryKey.join("/");
    }

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Vendor-specific query function with authentication headers
export const getVendorQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get vendor data from localStorage
    const storedVendorData = localStorage.getItem('vendorData');
    if (!storedVendorData) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw new Error("Vendor not authenticated");
    }
    
    const vendorData = JSON.parse(storedVendorData);
    
    let url = queryKey[0] as string;
    
    // If there's a second element that's an object, treat it as query parameters
    if (queryKey.length > 1 && typeof queryKey[1] === 'object' && queryKey[1] !== null) {
      const params = new URLSearchParams();
      const queryParams = queryKey[1] as Record<string, any>;
      
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    } else if (queryKey.length > 1) {
      // Fallback: join with "/" for backward compatibility
      url = queryKey.join("/");
    }
    
    const res = await fetch(url, {
      headers: {
        'x-vendor-id': vendorData.id,
        'x-vendor-auth': vendorData.id,
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Admin-specific API request function with authentication headers
export async function adminApiRequest(
  url: string,
  method: string = "GET",
  data?: unknown | undefined,
): Promise<any> {
  // Get admin data from localStorage
  const storedAdminData = localStorage.getItem('adminData');
  if (!storedAdminData) {
    throw new Error("Admin not authenticated");
  }
  
  const adminData = JSON.parse(storedAdminData);
  
  const headers: Record<string, string> = {
    'x-admin-auth': adminData.id || 'admin-token', // Using admin ID as auth token
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Handle 204 No Content responses (no body to parse)
  if (res.status === 204) {
    console.log(`Admin API Response for ${method} ${url}: No Content (204)`);
    return null;
  }
  
  // Parse JSON response for other successful responses
  const result = await res.json();
  console.log(`Admin API Response for ${method} ${url}:`, result);
  return result;
}

// Admin-specific query function with authentication headers
export const getAdminQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get admin data from localStorage
    const storedAdminData = localStorage.getItem('adminData');
    if (!storedAdminData) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw new Error("Admin not authenticated");
    }
    
    const adminData = JSON.parse(storedAdminData);
    
    let url = queryKey[0] as string;
    
    // If there's a second element that's an object, treat it as query parameters
    if (queryKey.length > 1 && typeof queryKey[1] === 'object' && queryKey[1] !== null) {
      const params = new URLSearchParams();
      const queryParams = queryKey[1] as Record<string, any>;
      
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
    } else if (queryKey.length > 1) {
      // Fallback: join with "/" for backward compatibility
      url = queryKey.join("/");
    }
    
    const res = await fetch(url, {
      headers: {
        'x-admin-auth': adminData.id || 'admin-token',
      },
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes instead of Infinity
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
