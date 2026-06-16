import { GoogleGenAI } from '@google/genai';

export class GeminiService {
  private ai: GoogleGenAI;
  // Modelos ordenados por prioridade baseados na cota disponível (RPM)
  private fallbackModels = [
    'gemini-3.1-flash-lite', // 15 RPM
    'gemini-2.5-flash-lite', // 10 RPM
    'gemini-3.5-flash',      // 5 RPM
    'gemini-3-flash',        // 5 RPM
    'gemini-2.5-flash'       // 5 RPM
  ];

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
    });
  }

  private async executeWithFallback(prompt: string, temperature: number): Promise<string | null> {
    for (const model of this.fallbackModels) {
      try {
        const response = await this.ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            temperature: temperature,
          }
        });
        
        if (response.text) {
          return response.text.trim();
        }
      } catch (error) {
        console.warn(`[Gemini] Falha ao gerar com o modelo ${model}. Tentando o próximo...`, error instanceof Error ? error.message : '');
        // Se for o último modelo da lista, a exceção é engolida e retorna null, 
        // ou podemos lançar. Aqui vamos logar e tentar o próximo.
      }
    }
    return null;
  }

  async generateOptimizedTitle(productName: string, brand?: string, sizeMl?: string, perfumeType?: string): Promise<string> {
    const prompt = `
      Você é um especialista em SEO para Mercado Livre especializado em perfumaria.
      Sua tarefa é criar o MELHOR título possível para o anúncio de um perfume.
      Regras:
      1. O título deve ter no MÁXIMO 60 caracteres.
      2. Deve conter as palavras-chave mais buscadas (ex: Original, Lacrado, Masculino/Feminino, se aplicável).
      3. Seja direto e não adicione aspas na resposta.

      Dados do produto:
      Nome: ${productName}
      Marca: ${brand || 'Não especificada'}
      Tamanho: ${sizeMl || 'Não especificado'}
      Tipo: ${perfumeType || 'Não especificado'}
      
      Retorne APENAS o título sugerido.
    `;

    const result = await this.executeWithFallback(prompt, 0.7);
    return result || productName; // Fallback extremo: retorna o próprio nome do produto
  }

  async generateDescription(productData: any): Promise<string> {
    const prompt = `
      Você é um copywriter de elite especialista em conversão no Mercado Livre.
      Crie uma descrição matadora para o seguinte produto.
      
      Dados:
      ${JSON.stringify(productData, null, 2)}

      A descrição deve ter:
      1. Um título chamativo na primeira linha.
      2. Uma breve introdução focada nos desejos do cliente (ex: projeção, fixação, presença).
      3. Bullet points com as principais notas olfativas (se deduzir pelo nome do perfume) e vantagens.
      4. Um call to action forte no final.
      
      Não use formatação Markdown como asteriscos duplos, o Mercado Livre aceita apenas texto plano quebrado por linhas.
    `;

    const result = await this.executeWithFallback(prompt, 0.8);
    return result || ''; // Fallback extremo: retorna vazio para não travar a criação
  }
}
