declare const __APP_VERSION__: string;

// Google Identity Services (GIS)
declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        requestAccessToken(config?: { prompt?: string }): void;
      }
      interface TokenClientConfig {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: { type: string; message?: string }) => void;
      }
      interface TokenResponse {
        access_token: string;
        expires_in: number;
        scope: string;
        token_type: string;
        error?: string;
      }
      function initTokenClient(config: TokenClientConfig): TokenClient;
      function revoke(token: string, callback?: () => void): void;
    }
  }
}
