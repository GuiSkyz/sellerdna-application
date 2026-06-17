import crypto from 'crypto';

export interface MLTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

export class MercadoLivreAuthService {
  private appId: string;
  private secretKey: string;
  private redirectUri: string;

  constructor() {
    this.appId = process.env.ML_APP_ID || '';
    this.secretKey = process.env.ML_SECRET_KEY || '';
    this.redirectUri = process.env.ML_REDIRECT_URI || 'http://localhost:3000/api/ml/callback';
  }

  /**
   * Gera um code_verifier aleatório para PKCE (entre 43-128 caracteres)
   */
  generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Gera o code_challenge a partir do code_verifier usando SHA256
   */
  generateCodeChallenge(codeVerifier: string): string {
    return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  }

  /**
   * Gera a URL de autorização do Mercado Livre com PKCE
   */
  getAuthUrl(state: string, codeChallenge: string): string {
    return `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${this.appId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  }

  /**
   * Troca o código de autorização pelo token de acesso (com PKCE code_verifier)
   */
  async exchangeCode(code: string, codeVerifier: string): Promise<MLTokenResponse> {
    const url = 'https://api.mercadolibre.com/oauth/token';
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.appId,
      client_secret: this.secretKey,
      code,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('ML Token Exchange Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        redirect_uri: this.redirectUri,
        app_id: this.appId,
      });
      throw new Error(`ML Auth Error: ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json() as MLTokenResponse;
    return data;
  }

  async refreshToken(refreshToken: string): Promise<MLTokenResponse> {
    const url = 'https://api.mercadolibre.com/oauth/token';
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.appId,
      client_secret: this.secretKey,
      refresh_token: refreshToken,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: body.toString()
    });

    if (!response.ok) {
      throw new Error(`ML Refresh Error: ${response.statusText}`);
    }

    const data = await response.json() as MLTokenResponse;
    return data;
  }
}
