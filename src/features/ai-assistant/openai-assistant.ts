import OpenAI from "openai";

export class OpenAIAssistant {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error("OpenAI API key is required");
        }
        this.client = new OpenAI({ 
            apiKey: apiKey,
            dangerouslyAllowBrowser: true 
        });
        this.assistant = null;
        this.thread = null;
    }

    async initialize(instructions = `You are an AI interviewer conducting a professional job interview. Help candidates by:
        - Asking relevant questions about their experience and skills
        - Providing thoughtful follow-up questions
        - Maintaining a professional and engaging conversation
        - Adapting questions based on the candidate's responses
        Be professional, clear, and concise in your questions.`) {
        try {
            // Create an assistant
            this.assistant = await this.client.beta.assistants.create({
                name: "AI Interviewer",
                instructions,
                tools: [],
                model: "gpt-4-turbo-preview",
            });

            // Create a thread
            this.thread = await this.client.beta.threads.create();
            console.log("Assistant and thread initialized successfully");
        } catch (error) {
            console.error("Error initializing OpenAI:", error);
            throw new Error(`Failed to initialize OpenAI: ${error.message}`);
        }
    }

    async getResponse(userMessage) {
        if (!this.assistant || !this.thread) {
            throw new Error("Assistant not initialized. Call initialize() first.");
        }

        try {
            // Add user message to thread
            await this.client.beta.threads.messages.create(this.thread.id, {
                role: "user",
                content: userMessage,
            });

            // Create and run the assistant
            const run = await this.client.beta.threads.runs.createAndPoll(
                this.thread.id,
                { assistant_id: this.assistant.id }
            );

            if (run.status === "completed") {
                // Get the assistant's response
                const messages = await this.client.beta.threads.messages.list(
                    this.thread.id
                );

                // Get the latest assistant message
                const lastMessage = messages.data.find(
                    (msg) => msg.role === "assistant"
                );

                if (lastMessage && lastMessage.content[0].type === "text") {
                    return lastMessage.content[0].text.value;
                }
            }

            return "Sorry, I couldn't process your request.";
        } catch (error) {
            console.error("Error getting response:", error);
            throw error;
        }
    }

    async getStreamingResponse(userMessage) {
        if (!this.assistant || !this.thread) {
            throw new Error("Assistant not initialized. Call initialize() first.");
        }

        try {
            // Add user message to thread
            await this.client.beta.threads.messages.create(this.thread.id, {
                role: "user",
                content: userMessage,
            });

            // Create run with streaming
            return this.client.beta.threads.runs.stream(this.thread.id, {
                assistant_id: this.assistant.id,
            });
        } catch (error) {
            console.error("Error getting streaming response:", error);
            throw error;
        }
    }
}
