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
      Você é um Consultor Sênior Profissional de Marketplace, especialista nos macetes do algoritmo do Mercado Livre.
      Sua tarefa é criar o MELHOR título possível para o anúncio de um produto.
      
      Regras INEGOCIÁVEIS:
      1. O título deve ter EXATAMENTE 60 caracteres ou um pouco menos (NUNCA MAIS QUE 60 CARACTERES).
      2. Deve conter as palavras-chave mais buscadas e os termos de maior conversão do ML (ex: Original, Lacrado, envio rápido, se aplicável).
      3. Seja cirúrgico, focado na intenção de busca do comprador.
      4. Não adicione aspas na resposta e não passe de 60 caracteres sob nenhuma hipótese.

      Dados do produto:
      Nome: ${productName}
      Marca: ${brand || 'Não especificada'}
      Tamanho: ${sizeMl || 'Não especificado'}
      Tipo: ${perfumeType || 'Não especificado'}
      
      Retorne APENAS o título sugerido, sem explicações.
    `;

    const result = await this.executeWithFallback(prompt, 0.7);
    return result || productName; // Fallback extremo: retorna o próprio nome do produto
  }

  async generateDescription(productData: any): Promise<string> {
    const isPerfume = productData.productType === 'Perfume' || productData.sizeMl || productData.perfumeType;
    
    const prompt = `
      Você é um Consultor Sênior Profissional de Marketplace, atuando no Mercado Livre com estratégias avançadas de conversão.
      Sua tarefa é criar uma DESCRIÇÃO MATADORA e personalizada para o seguinte produto.
      
      Dados que temos (use seu conhecimento para complementar o que estiver faltando, pesquisando internamente se for de uma marca conhecida):
      ${JSON.stringify(productData, null, 2)}

      A descrição deve ter OBRIGATORIAMENTE a seguinte estrutura:
      1. UM TÍTULO CHAMATIVO: (Primeira linha, em caixa alta, destacando o desejo do cliente).
      2. INTRODUÇÃO PERSUASIVA: (Breve parágrafo focando em benefícios emocionais ou resolução de dor).
      3. CARACTERÍSTICAS PRINCIPAIS: (Em formato de bullet points simples usando "-").
      ${isPerfume ? `4. PIRÂMIDE OLFATIVA: (Busque em seu conhecimento as notas de Topo, Coração e Fundo para este perfume exato da marca ${productData.brand || ''}). Se for uma marca não reconhecida, gere uma pirâmide coerente com o tipo de perfume.` : ''}
      5. COMO USAR: (Dicas práticas de aplicação/uso para melhor aproveitamento).
      6. ONDE USAR / OCASIÕES: (Em quais momentos, climas ou ocasiões este produto brilha mais).
      7. QUEBRA DE OBJEÇÕES E CHAMADA PARA AÇÃO: (Tranquilize o cliente sobre originalidade/qualidade e finalize com um CTA forte para compra imediata).
      
      IMPORTANTE PARA O MERCADO LIVRE:
      Não use formatação Markdown com asteriscos duplos (**), pois o Mercado Livre aceita apenas texto plano. Use letras maiúsculas para destacar TÍTULOS DE SEÇÕES. Use hifens (-) para criar listas.
    `;

    const result = await this.executeWithFallback(prompt, 0.8);
    return result || ''; // Fallback extremo: retorna vazio para não travar a criação
  }
}
