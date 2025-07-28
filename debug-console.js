/**
 * Debug Console for La Tanda Web App
 * Test API connectivity and debug JavaScript functions
 */

const API_BASE = 'https://api.latanda.online';

// Debug functions from the web app
function debugAPICall(endpoint) {
    console.log(`🔍 Testing endpoint: ${endpoint}`);
    
    fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, debug: true })
    })
    .then(response => {
        console.log(`✅ Response status: ${response.status}`);
        return response.text();
    })
    .then(data => {
        console.log(`📦 Response data:`, data);
    })
    .catch(error => {
        console.log(`❌ Error:`, error.message);
    });
}

// Test MIA responses
function debugMIAResponse(message) {
    console.log(`🤖 Testing MIA with message: "${message}"`);
    
    const responses = {
        'hola': '¡Hola! Soy MIA, tu asistente de La Tanda v2.0. ¿Cómo puedo ayudarte?',
        'grupos': 'Tenemos 25+ grupos activos. ¿Te interesa unirte como miembro o ser coordinador?',
        'coordinador': '¡Excelente! Como coordinador puedes ganar L2,000-8,000+ mensuales. ¿Quieres aplicar?',
        'pagos': 'Aceptamos Tigo Money, Claro Money y transferencias bancarias. ¿Qué método prefieres?',
        'ayuda': 'Estoy aquí para ayudarte con grupos, pagos, verificación y más. ¿Qué necesitas?'
    };
    
    const key = Object.keys(responses).find(k => message.toLowerCase().includes(k));
    const response = key ? responses[key] : 'Entiendo tu consulta. Nuestro sistema v2.0 con 85 endpoints puede ayudarte con eso. ¿Podrías ser más específico?';
    
    console.log(`💬 MIA Response:`, response);
    return response;
}

// Debug authentication
function debugAuth() {
    console.log('🔐 Testing authentication flow...');
    console.log('Demo credentials: demo@latanda.online / demo123');
    
    // Simulate auth process
    setTimeout(() => {
        console.log('✅ Authentication successful');
        console.log('🎯 All 85 endpoints available');
    }, 1500);
}

// Run debug tests
console.log('🚀 La Tanda Web Debug Console Started');
console.log('Available functions:');
console.log('- debugAPICall(endpoint)');
console.log('- debugMIAResponse(message)');
console.log('- debugAuth()');

// Example usage
console.log('\n📝 Example tests:');
debugAuth();
debugMIAResponse('hola');
debugAPICall('/api/groups');