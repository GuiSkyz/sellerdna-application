import { GeminiService } from '../../infrastructure/integrations/gemini/GeminiService';

export class OptimizeListingUseCase {
  constructor(private aiService: GeminiService) {}

  async execute(productData: any): Promise<{ optimizedTitle: string, optimizedDescription: string }> {
    // Roda sequencialmente para não estourar o limite de requisições por segundo da API gratuita do Gemini
    const optimizedTitle = await this.aiService.generateOptimizedTitle(
      productData.name, 
      productData.brand, 
      productData.sizeMl, 
      productData.perfumeType
    );
    
    // Delay para evitar 429 Too Many Requests (Gemini Free limit é de 15 RPM)
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const optimizedDescription = await this.aiService.generateDescription(productData);

    if (!optimizedDescription) {
      throw new Error('Falha ao gerar descrição com a IA. A API do Google pode estar sobrecarregada ou bloqueou o conteúdo. Tente novamente em alguns segundos.');
    }

    return {
      optimizedTitle,
      optimizedDescription
    };
  }
}
