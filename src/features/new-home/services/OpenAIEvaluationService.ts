import OpenAI from "openai";

class OpenAIEvaluationService {
  private client: OpenAI;
  private writingPrompt: string;
  private speakingPrompt: string;
  private model: string;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      throw new Error(
        "OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY environment variable."
      );
    }

    // Get model from environment, default to gpt-4 if not set
    this.model =
      import.meta.env.VITE_OPENAI_MODEL || "gpt-4";

    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
    });

    this.writingPrompt = `You are a professional writing assessor for business English. Evaluate the following business writing response based on these criteria:

1. Clarity and Organization (1-10): How well-structured and clear the response is
2. Grammar and Vocabulary (1-10): Accuracy of grammar and appropriateness of vocabulary
3. Professional Tone (1-10): How professional and business-appropriate the tone is
4. Content Relevance (1-10): How well the response addresses the given prompt

Provide your evaluation in this exact format:
SCORES:
- Clarity and Organization: [score]/10
- Grammar and Vocabulary: [score]/10
- Professional Tone: [score]/10
- Content Relevance: [score]/10
- Overall Score: [average]/10

FEEDBACK:
[Detailed feedback with specific improvement suggestions]

Here is the writing prompt and response to evaluate:
PROMPT: {prompt}
RESPONSE: {response}`;

    this.speakingPrompt = `You are a professional speaking assessor for business English. Evaluate the following transcribed speaking response based on these criteria:

1. Pronunciation and Clarity (1-10): How clear and understandable the speech is
2. Fluency and Pace (1-10): How smooth and natural the speech flow is
3. Grammar and Vocabulary (1-10): Accuracy of grammar and appropriateness of vocabulary
4. Content Organization (1-10): How well-structured and coherent the response is

Provide your evaluation in this exact format:
SCORES:
- Pronunciation and Clarity: [score]/10
- Fluency and Pace: [score]/10
- Grammar and Vocabulary: [score]/10
- Content Organization: [score]/10
- Overall Score: [average]/10

FEEDBACK:
[Detailed feedback with specific improvement suggestions]

Here is the speaking prompt and transcribed response to evaluate:
PROMPT: {prompt}
TRANSCRIPTION: {transcription}`;
  }

  async evaluateWriting(prompt: string, response: string) {
    try {
      const evaluationPrompt = this.writingPrompt
        .replace("{prompt}", prompt)
        .replace("{response}", response);

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: evaluationPrompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const evaluationText = completion.choices[0].message.content || "";
      return this.extractWritingScores(evaluationText);
    } catch (error) {
      console.error("Error evaluating writing:", error);
      throw new Error(
        `Writing evaluation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async evaluateSpeaking(prompt: string, transcription: string) {
    try {
      const evaluationPrompt = this.speakingPrompt
        .replace("{prompt}", prompt)
        .replace("{transcription}", transcription);

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: evaluationPrompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const evaluationText = completion.choices[0].message.content || "";
      return this.extractSpeakingScores(evaluationText);
    } catch (error) {
      console.error("Error evaluating speaking:", error);
      throw new Error(
        `Speaking evaluation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async transcribeAudio(audioBlob: Blob) {
    try {
      const audioFile = new File([audioBlob], "audio.webm", {
        type: "audio/webm",
      });

      const transcription = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
      });

      return transcription.text;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw new Error(
        `Audio transcription failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private extractWritingScores(evaluationText: string) {
    try {
      const scores: Record<string, number> = {};
      const feedback: Record<string, string> = {};

      const clarityMatch = evaluationText.match(
        /Clarity and Organization:\s*(\d+(?:\.\d+)?)/i
      );
      const grammarMatch = evaluationText.match(
        /Grammar and Vocabulary:\s*(\d+(?:\.\d+)?)/i
      );
      const toneMatch = evaluationText.match(
        /Professional Tone:\s*(\d+(?:\.\d+)?)/i
      );
      const contentMatch = evaluationText.match(
        /Content Relevance:\s*(\d+(?:\.\d+)?)/i
      );
      const overallMatch = evaluationText.match(
        /Overall Score:\s*(\d+(?:\.\d+)?)/i
      );

      scores.clarity = clarityMatch ? parseFloat(clarityMatch[1]) : 0;
      scores.grammar = grammarMatch ? parseFloat(grammarMatch[1]) : 0;
      scores.tone = toneMatch ? parseFloat(toneMatch[1]) : 0;
      scores.content = contentMatch ? parseFloat(contentMatch[1]) : 0;
      scores.overall = overallMatch ? parseFloat(overallMatch[1]) : 0;

      const feedbackMatch = evaluationText.match(
        /FEEDBACK:\s*([\s\S]*?)(?=\n\n|$)/i
      );
      feedback.detailed = feedbackMatch
        ? feedbackMatch[1].trim()
        : "No detailed feedback available.";

      return {
        scores,
        feedback,
        rawEvaluation: evaluationText,
      };
    } catch (error) {
      console.error("Error extracting writing scores:", error);
      return {
        scores: { overall: 0 },
        feedback: { detailed: "Error processing evaluation." },
        rawEvaluation: evaluationText,
      };
    }
  }

  private extractSpeakingScores(evaluationText: string) {
    try {
      const scores: Record<string, number> = {};
      const feedback: Record<string, string> = {};

      const pronunciationMatch = evaluationText.match(
        /Pronunciation and Clarity:\s*(\d+(?:\.\d+)?)/i
      );
      const fluencyMatch = evaluationText.match(
        /Fluency and Pace:\s*(\d+(?:\.\d+)?)/i
      );
      const grammarMatch = evaluationText.match(
        /Grammar and Vocabulary:\s*(\d+(?:\.\d+)?)/i
      );
      const contentMatch = evaluationText.match(
        /Content Organization:\s*(\d+(?:\.\d+)?)/i
      );
      const overallMatch = evaluationText.match(
        /Overall Score:\s*(\d+(?:\.\d+)?)/i
      );

      scores.pronunciation = pronunciationMatch
        ? parseFloat(pronunciationMatch[1])
        : 0;
      scores.fluency = fluencyMatch ? parseFloat(fluencyMatch[1]) : 0;
      scores.grammar = grammarMatch ? parseFloat(grammarMatch[1]) : 0;
      scores.content = contentMatch ? parseFloat(contentMatch[1]) : 0;
      scores.overall = overallMatch ? parseFloat(overallMatch[1]) : 0;

      const feedbackMatch = evaluationText.match(
        /FEEDBACK:\s*([\s\S]*?)(?=\n\n|$)/i
      );
      feedback.detailed = feedbackMatch
        ? feedbackMatch[1].trim()
        : "No detailed feedback available.";

      return {
        scores,
        feedback,
        rawEvaluation: evaluationText,
      };
    } catch (error) {
      console.error("Error extracting speaking scores:", error);
      return {
        scores: { overall: 0 },
        feedback: { detailed: "Error processing evaluation." },
        rawEvaluation: evaluationText,
      };
    }
  }
}

const openAIEvaluationService = new OpenAIEvaluationService();
export default openAIEvaluationService;

