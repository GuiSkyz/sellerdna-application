

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

  getAuthUrl(state: string): string {
    return `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${this.appId}&redirect_uri=${this.redirectUri}&state=${state}`;
  }

  async exchangeCode(code: string): Promise<MLTokenResponse> {
    const url = 'https://api.mercadolibre.com/oauth/token';
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.appId,
      client_secret: this.secretKey,
      code,
      redirect_uri: this.redirectUri,
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
      throw new Error(`ML Auth Error: ${response.statusText}`);
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
