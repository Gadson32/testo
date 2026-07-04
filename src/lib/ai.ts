export interface AIServiceInterface {
  identifyPest(imageUrl: string): Promise<{ pest: string; confidence: number }>;
  suggestTreatment(pest: string, location: string): Promise<{ method: string; products: string[] }>;
  summarizeReport(findings: string): Promise<string>;
}

export class PlaceholderAIService implements AIServiceInterface {
  async identifyPest(_imageUrl: string) {
    return { pest: "Not yet implemented", confidence: 0 };
  }

  async suggestTreatment(_pest: string, _location: string) {
    return { method: "Not yet implemented", products: [] };
  }

  async summarizeReport(_findings: string) {
    return "AI summarization not yet configured.";
  }
}

export const aiService: AIServiceInterface = new PlaceholderAIService();
