import { GoogleGenAI } from '@google/genai';

export class GeminiService {
  private apiKeys: string[] = [];
  private currentKeyIndex = 0;
  private fallbackModels = [
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-1.5-flash'
  ];

  constructor() {
    const keysEnv = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || 'AIzaSyA_PLACEHOLDER_NOT_REAL';
    this.apiKeys = keysEnv.split(',').map(k => k.trim()).filter(Boolean);
    if (this.apiKeys.length === 0) {
      this.apiKeys = ['AIzaSyA_PLACEHOLDER_NOT_REAL'];
    }
  }

  private getClient(): GoogleGenAI {
    const key = this.apiKeys[this.currentKeyIndex % this.apiKeys.length];
    return new GoogleGenAI({ apiKey: key });
  }

  private rotateKey() {
    if (this.apiKeys.length > 1) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      console.warn(`[Gemini] Rotacionando para a chave de API #${this.currentKeyIndex + 1} de ${this.apiKeys.length}`);
    }
  }

  private async executeWithFallback(prompt: string, temperature: number): Promise<string | null> {
    let lastError: any = null;

    // 1º LINHA DE DEFESA E TURBO: Tenta via Groq (llama-3.3-70b-versatile / llama-3.1-8b-instant) se a chave estiver configurada
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey !== 'AIzaSyA_PLACEHOLDER_NOT_REAL') {
      const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
      for (const groqModel of groqModels) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model: groqModel,
              messages: [{ role: 'user', content: prompt }],
              temperature: temperature,
              max_tokens: 1500
            })
          });
          if (res.ok) {
            const data: any = await res.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) {
              return text.trim();
            }
          } else {
            const errText = await res.text();
            console.warn(`[AI Engine] Groq (${groqModel}) retornou status ${res.status}: ${errText.substring(0, 100)}. Tentando próximo...`);
          }
        } catch (groqErr: any) {
          console.warn(`[AI Engine] Falha na conexão com Groq (${groqModel}):`, groqErr?.message || groqErr);
        }
      }
    }

    // 2º LINHA DE DEFESA / FALLBACK: Google Gemini com Rotação de Chaves e Cadenciamento
    for (let retry = 0; retry < 2; retry++) {
      for (const model of this.fallbackModels) {
        try {
          const ai = this.getClient();
          const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
              temperature: temperature,
            }
          });
          
          if (response.text) {
            return response.text.trim();
          }
        } catch (error: any) {
          lastError = error;
          const status = error?.status || error?.code;
          const message = error instanceof Error ? error.message : JSON.stringify(error);
          
          // Se for erro de Cota/Rate Limit (429) ou Exaustão
          if (status === 429 || status === 'RESOURCE_EXHAUSTED' || message.includes('429') || message.includes('Quota exceeded')) {
            console.warn(`[Gemini] Cota excedida no modelo ${model}. Rotacionando chave ou aplicando pausa anti-rate limit...`);
            this.rotateKey();
            // Pausa de 3.5s antes de tentar outro modelo/retry para aliviar a janela RPM
            await new Promise(r => setTimeout(r, 3500));
          } else {
            console.warn(`[Gemini] Falha no modelo ${model}:`, message);
          }
        }
      }
    }
    throw new Error(`Falha em todos os modelos da IA (Groq + Gemini): ${lastError?.message || 'Erro desconhecido'}`);
  }

  async generateOptimizedTitle(productName: string, brand?: string, sizeMl?: string, perfumeType?: string): Promise<string> {
    const prompt = `
      Você é um Consultor Sênior Profissional de Marketplace, especialista nos algoritmos do Mercado Livre.
      Sua tarefa é criar o MELHOR título possível para o anúncio de um produto com foco 100% em SEO e confiança.
      
      Regras INEGOCIÁVEIS E CRÍTICAS:
      1. O título DEVE TER NO MÁXIMO 55 CARACTERES. Seja extremamente conciso. Menos é mais.
      2. Estrutura de SEO ideal: [Tipo de Produto] + [Marca] + [Nome] + [Volume] + [Gênero se houver] + [Palavra de Confiança].
      3. Palavras de confiança permitidas: Original, Lacrado. 
      4. PROIBIDO o uso de clichês de envio como: "Envio Já", "Envio Rápido", "Pronta Entrega", "Chega Hoje".
      5. Não adicione aspas, nem pontos finais.
      6. NUNCA invente volumetrias ou marcas que não estão nos dados abaixo.

      Dados do produto:
      Nome: ${productName}
      Marca: ${brand || 'Não especificada'}
      Tamanho: ${sizeMl || 'Não especificado'}
      Tipo: ${perfumeType || 'Não especificado'}
      
      Retorne APENAS o título sugerido. Exemplo: "Perfume Club De Nuit Intense Masculino 105ml Original"
    `;

    const result = await this.executeWithFallback(prompt, 0.7);
    let finalTitle = result || productName;
    
    // Se a IA alucinar e passar de 60, nós cortamos de forma segura no último espaço
    if (finalTitle.length > 60) {
      const truncated = finalTitle.substring(0, 60);
      const lastSpace = truncated.lastIndexOf(' ');
      finalTitle = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
    }
    
    return finalTitle;
  }

  async generateDescription(productData: any): Promise<string> {
    const isPerfume = productData.productType === 'Perfume' || productData.sizeMl || productData.perfumeType;
    
    const prompt = `
      Você é um Consultor Sênior Profissional de Marketplace, atuando no Mercado Livre com estratégias avançadas de conversão.
      Sua tarefa é criar uma DESCRIÇÃO ALTAMENTE VENDEDORA e personalizada para o seguinte produto.
      
      Dados que temos (traga apenas informações 100% VERDADEIRAS, oficiais e reais do fabricante sobre este perfume exato. NUNCA invente volumetrias, marcas, notas olfativas falsas ou dados fictícios. Se não tiver certeza absoluta de alguma nota da pirâmide olfativa do perfume da marca ${productData.brand || ''}, não a invente de forma alguma):
      ${JSON.stringify(productData, null, 2)}

      A descrição deve ter OBRIGATORIAMENTE a seguinte estrutura:
      1. UM TÍTULO CHAMATIVO: (Primeira linha, em caixa alta, destacando o desejo do cliente).
      2. INTRODUÇÃO PERSUASIVA: (Breve parágrafo focando em benefícios emocionais ou resolução de dor).
      3. CARACTERÍSTICAS PRINCIPAIS: (Em formato de bullet points simples usando "-").
      ${isPerfume ? `4. PIRÂMIDE OLFATIVA: (Busque em seu conhecimento as notas REAIS de Topo, Coração e Fundo para este perfume exato da marca ${productData.brand || ''}. Se for uma marca desconhecida ou você não possuir registro real das notas oficiais, NÃO invente notas e remova esta seção da pirâmide).` : ''}
      5. COMO USAR: (Dicas práticas de aplicação/uso para melhor aproveitamento).
      6. ONDE USAR / OCASIÕES: (Em quais momentos, climas ou ocasiões este produto brilha mais).
      7. QUEBRA DE OBJEÇÕES E CHAMADA PARA AÇÃO: (Tranquilize o cliente sobre originalidade/qualidade e finalize com um CTA forte para compra imediata).
      
      IMPORTANTE PARA O MERCADO LIVRE E RESTRIÇÕES:
      1. Não use formatação Markdown com asteriscos duplos (**), pois o Mercado Livre aceita apenas texto plano. Use letras maiúsculas para destacar TÍTULOS DE SEÇÕES. Use hifens (-) para criar listas.
      2. NUNCA SE APRESENTE OU INCLUA TEXTOS CONVERSACIONAIS. NÃO inicie com frases como "Aqui está a descrição", "Sou seu consultor sênior", ou "Vamos criar uma descrição". RETORNE APENAS O CONTEÚDO FINAL DA DESCRIÇÃO.
      3. INFORMAÇÕES ESTRITAMENTE VERDADEIRAS: É estritamente proibido inventar especificações, volumetrias ou pirâmides olfativas fantasiosas. O foco total deve ser a verdade factual do produto.
    `;

    const result = await this.executeWithFallback(prompt, 0.8);
    return result || ''; // Fallback extremo: retorna vazio para não travar a criação
  }
}
