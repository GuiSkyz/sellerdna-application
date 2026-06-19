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
    
    // Pequeno delay para evitar 429 Too Many Requests
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const optimizedDescription = await this.aiService.generateDescription(productData);

    // TODO: Salvar registro de geração na tabela AI_GENERATIONS para auditoria e histórico

    return {
      optimizedTitle,
      optimizedDescription
    };
  }
}
