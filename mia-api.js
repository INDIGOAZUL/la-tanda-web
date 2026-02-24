/**
 * MIA AI API - La Tanda Intelligent Assistant
 * Uses Groq API with Llama 3.3 70B
 */

const MIA_KNOWLEDGE = require('./mia-knowledge-base.js');

// Build system prompt with full context
function buildSystemPrompt() {
    return `Eres MIA, la Asistente Inteligente de La Tanda.

IDENTIDAD:
- Nombre: MIA
- Personalidad: Amigable, profesional, conocedora
- Idioma: Español (Honduras)
- Tono: Útil, claro, motivador

SOBRE LA TANDA:
${MIA_KNOWLEDGE.platform.description}

Misión: ${MIA_KNOWLEDGE.platform.mission}

CARACTERÍSTICAS PRINCIPALES:
1. TANDAS: ${MIA_KNOWLEDGE.features.tandas.description}
2. WALLET: ${MIA_KNOWLEDGE.features.wallet.description}
3. MARKETPLACE: ${MIA_KNOWLEDGE.features.marketplace.description}
4. LOTERÍA: ${MIA_KNOWLEDGE.features.lottery.description}

TOKEN LTD:
- ${MIA_KNOWLEDGE.token.fullName}
- Supply: ${MIA_KNOWLEDGE.token.totalSupply}
- Usos: ${MIA_KNOWLEDGE.token.uses.join(', ')}

ESTRATEGIA BLOCKCHAIN:
- Fase 1: ${MIA_KNOWLEDGE.blockchainStrategy.phase1.name} (${MIA_KNOWLEDGE.blockchainStrategy.phase1.timeline})
- Fase 2: ${MIA_KNOWLEDGE.blockchainStrategy.phase2.name} con ${MIA_KNOWLEDGE.blockchainStrategy.phase2.validators} validators

SOPORTE:
- Email: ${MIA_KNOWLEDGE.support.email}
- Discord: ${MIA_KNOWLEDGE.support.discord}
- Telegram: ${MIA_KNOWLEDGE.support.telegram}

INSTRUCCIONES:
1. Responde SIEMPRE en español
2. Usa formato estructurado:
   - Parrafos cortos (2-3 oraciones maximo)
   - Usa bullets (•) para listas
   - Usa numeros (1. 2. 3.) para pasos secuenciales
   - Separa secciones con lineas en blanco
3. Usa **texto** para resaltar palabras importantes
4. Si no sabes algo, admitelo y sugiere contactar soporte
5. Usa emojis con moderacion (1-2 por respuesta maximo)
6. Guia a los usuarios a las paginas correctas
7. Mantén respuestas concisas - maximo 150 palabras
8. Termina con una pregunta o invitacion a seguir ayudando`;
}

// Handle MIA chat requests
async function handleMiaRequest(req, res, pathname, method, sendSuccess, sendError, authenticateRequest, parseBody, log) {
    
    // POST /api/mia/chat
    if (pathname === '/api/mia/chat' && method === 'POST') {
        // v4.3.0: Require authentication
        const auth = authenticateRequest(req);
        if (!auth.authenticated) {
            return sendError(res, 401, 'Autenticacion requerida');
        }
        try {
            const body = await parseBody(req);
            const { message, conversationHistory = [] } = body;
            
            if (!message || message.trim() === '') {
                return sendError(res, 400, 'Message is required');
            }
            // v4.3.0: Input length validation
            if (message.length > 2000) {
                return sendError(res, 400, 'El mensaje no puede exceder 2000 caracteres');
            }
            
            const GROQ_API_KEY = process.env.GROQ_API_KEY;
            const MIA_MODEL = process.env.MIA_MODEL || 'llama-3.3-70b-versatile';
            
            if (!GROQ_API_KEY) {
                log('ERROR', 'GROQ_API_KEY not configured');
                return sendError(res, 500, 'AI service not configured');
            }
            
            // Build messages array
            // v4.3.0: Sanitize conversation history — only allow user/assistant roles
            const sanitizedHistory = conversationHistory.slice(-10)
                .filter(msg => msg && typeof msg === 'object')
                .map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: String(msg.content || '').substring(0, 2000)
                }));
            const messages = [
                { role: 'system', content: buildSystemPrompt() },
                ...sanitizedHistory, // Last 10 messages for context
                { role: 'user', content: message }
            ];
            
            // Call Groq API
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: MIA_MODEL,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1024,
                    top_p: 0.9
                })
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                log('ERROR', `Groq API error: ${response.status} - ${errorData}`);
                return sendError(res, 500, 'AI service temporarily unavailable');
            }
            
            const data = await response.json();
            const aiResponse = data.choices[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.';
            
            log('INFO', `MIA responded to: ${message.substring(0, 50)}...`);
            
            return sendSuccess(res, {
                response: aiResponse,
                model: MIA_MODEL,
                usage: data.usage
            });
            
        } catch (error) {
            log('ERROR', `MIA chat error: ${error.message}`);
            return sendError(res, 500, 'Error processing your message');
        }
    }
    
    // GET /api/mia/status
    if (pathname === '/api/mia/status' && method === 'GET') {
        return sendSuccess(res, {
            status: 'online',
            name: MIA_KNOWLEDGE.identity.name
        });
    }
    
    return false; // Not handled
}

module.exports = { handleMiaRequest };
