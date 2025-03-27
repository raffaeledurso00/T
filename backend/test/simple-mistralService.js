// simple-mistralService.js
class SimpleMistralService {
    async processMessage(message, sessionId) {
        console.log(`[SimpleMistralService] Processing message: ${message} for session: ${sessionId}`);
        return {
            message: "This is a test response from the simplified mistral service",
            sessionId: sessionId || "test-session"
        };
    }

    async clearHistory(sessionId) {
        console.log(`[SimpleMistralService] Clearing history for session: ${sessionId}`);
        return {
            message: "History cleared (test)",
            sessionId: sessionId
        };
    }

    async initSession() {
        const sessionId = `test-${Date.now()}`;
        console.log(`[SimpleMistralService] Initializing session: ${sessionId}`);
        return {
            message: "Session initialized (test)",
            sessionId: sessionId
        };
    }
}

module.exports = new SimpleMistralService();