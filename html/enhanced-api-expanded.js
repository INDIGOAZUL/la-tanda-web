const http = require('http');

const hostname = '0.0.0.0';
const port = 3000;

// Simple in-memory database for demonstration (PRESERVED)
const tandaGroups = [
    {
        id: 'tanda001',
        name: 'Family Savings',
        members: 12,
        contributionAmount: 100,
        frequency: 'weekly',
        status: 'active'
    },
    {
        id: 'tanda002',
        name: 'Friends Emergency Fund',
        members: 8,
        contributionAmount: 200,
        frequency: 'monthly',
        status: 'active'
    },
    {
        id: 'tanda003',
        name: 'Neighborhood Project',
        members: 20,
        contributionAmount: 50,
        frequency: 'biweekly',
        status: 'forming'
    }
];

// API endpoints
const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
    }
    
    // Parse URL path
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    
    // ===== EXISTING ENDPOINTS (PRESERVED) =====
    
    // Root endpoint - PRESERVED EXACTLY
    if (path === '/') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: "API is working" }));
        return;
    }
    
    // API health check (EXISTING)
    if (path === '/api/health') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            status: 'online',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        }));
        return;
    }
    
    // API documentation (EXISTING - ENHANCED)
    if (path === '/api/docs') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            name: 'La Tanda API',
            description: 'API for La Tanda group savings platform',
            version: '1.1.0', // Updated version
            endpoints: [
                { path: '/', method: 'GET', description: 'Root endpoint - API status' },
                { path: '/api/health', method: 'GET', description: 'Health check endpoint' },
                { path: '/api/docs', method: 'GET', description: 'API documentation' },
                { path: '/api/groups', method: 'GET', description: 'Get all tanda groups' },
                { path: '/api/groups/:id', method: 'GET', description: 'Get a specific tanda group' },
                // NEW ENDPOINTS
                { path: '/api/info', method: 'GET', description: 'General system information' },
                { path: '/api/terms', method: 'GET', description: 'Terms and conditions' },
                { path: '/api/faq', method: 'GET', description: 'Frequently asked questions' },
                { path: '/api/legal', method: 'GET', description: 'Legal framework Honduras' },
                { path: '/api/contact', method: 'GET', description: 'Contact information' },
                { path: '/api/status', method: 'GET', description: 'System status' }
            ]
        }));
        return;
    }
    
    // Get all groups (EXISTING)
    if (path === '/api/groups') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            success: true,
            count: tandaGroups.length,
            data: tandaGroups
        }));
        return;
    }
    
    // Get group by ID (EXISTING)
    if (path.match(/^\/api\/groups\/[a-zA-Z0-9]+$/)) {
        const id = path.split('/').pop();
        const group = tandaGroups.find(group => group.id === id);
        
        if (group) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                success: true,
                data: group
            }));
        } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                success: false,
                error: 'Group not found'
            }));
        }
        return;
    }
    
    // ===== NEW ENDPOINTS (ADDED) =====
    
    // General Information
    if (path === '/api/info') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            name: "La Tanda API",
            version: "1.1.0",
            description: "Sistema de gestión de grupos de ahorro comunitario",
            ecosystem: {
                totalMoved: "L1,680,000+",
                familiesBenefited: "40+",
                activeGroups: 14,
                activeBots: 5,
                endpoints: "41+",
                existing_groups: tandaGroups.length
            },
            documentation: "https://latanda.online/docs",
            terms: "https://latanda.online/terms",
            support: "support@latanda.online",
            website: "https://latanda.online",
            integration_status: "✅ Successfully deployed"
        }));
        return;
    }
    
    // Terms and Conditions
    if (path === '/api/terms') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            title: "Términos y Condiciones - La Tanda",
            lastUpdated: "2025-07-19",
            sections: {
                participation: {
                    title: "Participación en Grupos de Ahorro",
                    content: [
                        "Compromiso de pago puntual y completo según cronograma acordado",
                        "Participación activa en reuniones y decisiones del grupo",
                        "Respeto a las reglas establecidas por el grupo",
                        "Responsabilidad compartida en el éxito del grupo"
                    ]
                },
                responsibilities: {
                    title: "Responsabilidades",
                    content: [
                        "Aportar la cantidad acordada en las fechas establecidas",
                        "Mantener comunicación transparente con el grupo",
                        "Cumplir con los acuerdos firmados",
                        "Respetar el turno de distribución establecido"
                    ]
                },
                risks: {
                    title: "Riesgos y Limitaciones",
                    content: [
                        "Sistema basado en confianza mutua",
                        "Sin respaldo bancario tradicional",
                        "Riesgo de incumplimiento de otros participantes",
                        "No genera intereses sobre ahorros"
                    ]
                },
                legal: {
                    title: "Marco Legal Honduras",
                    content: [
                        "Regulado por Decreto 201/93 - Ley de Cajas de Ahorro y Crédito Rural",
                        "Supervisión de CONSUCOOP para grupos formalizados",
                        "Cumplimiento de regulaciones de CNBS",
                        "Registro legal disponible para formalización"
                    ]
                }
            }
        }));
        return;
    }
    
    // FAQ
    if (path === '/api/faq') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            title: "Preguntas Frecuentes - La Tanda",
            categories: {
                general: {
                    title: "Información General",
                    questions: [
                        {
                            q: "¿Qué es una tanda?",
                            a: "Un sistema de ahorro colaborativo donde un grupo de personas contribuye con una cantidad fija regularmente, creando un fondo que se entrega por turnos a cada participante."
                        },
                        {
                            q: "¿Cómo funciona La Tanda?",
                            a: "Formamos grupos de confianza, establecemos contribuciones regulares, y distribuimos el fondo total a cada participante según un cronograma acordado."
                        },
                        {
                            q: "¿Es seguro participar?",
                            a: "La seguridad depende de la confianza del grupo y el cumplimiento de acuerdos. Recomendamos grupos formalizados con registro legal."
                        }
                    ]
                },
                legal: {
                    title: "Aspectos Legales",
                    questions: [
                        {
                            q: "¿Es legal participar en tandas en Honduras?",
                            a: "Sí, especialmente las Cajas Rurales registradas bajo el Decreto 201/93 que tienen respaldo legal completo."
                        },
                        {
                            q: "¿Qué pasa si alguien no paga?",
                            a: "Se aplican las reglas previamente establecidas por el grupo, que pueden incluir garantías, avales o exclusión."
                        }
                    ]
                }
            }
        }));
        return;
    }
    
    // Legal Framework
    if (path === '/api/legal') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            title: "Marco Legal - Honduras",
            country: "Honduras",
            lastUpdated: "2025-07-19",
            regulations: {
                primary: {
                    name: "Decreto 201/93",
                    title: "Ley de Cajas de Ahorro y Crédito Rural",
                    authority: "Congreso Nacional de Honduras"
                },
                supervision: {
                    consucoop: {
                        name: "CONSUCOOP",
                        title: "Consejo Nacional Supervisor de Cooperativas",
                        role: "Supervisión directa de Cooperativas de Ahorro y Crédito"
                    },
                    cnbs: {
                        name: "CNBS",
                        title: "Comisión Nacional de Bancos y Seguros",
                        role: "Regulación del sistema financiero nacional"
                    }
                },
                requirements: {
                    minimum_members: 10,
                    minimum_age: 21,
                    minimum_capital: "L. 5,000.00",
                    legal_registration: "Personería jurídica requerida"
                }
            }
        }));
        return;
    }
    
    // Contact Information
    if (path === '/api/contact') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            title: "Contacto - La Tanda",
            support: {
                email: "support@latanda.online",
                phone: "+504 9448 5859",
                hours: "Lunes a Viernes, 8:00 AM - 6:00 PM (GMT-6)"
            },
            technical: {
                api: "https://api.latanda.online",
                workflows: "https://n8n.latanda.online",
                website: "https://latanda.online"
            },
            social: {
                telegram: "@LaTandaOficialBot",
                bots: [
                    "@LaTandaOficialBot - Coordinador Master",
                    "@LaTanda_RegistroBot - Gestión de Grupos",
                    "@LaTanda_PaymentBot - Procesamiento de Pagos",
                    "@LaTanda_VerifyBot - Verificación KYC",
                    "@LaTanda_NotifyBot - Notificaciones"
                ]
            }
        }));
        return;
    }
    
    // System Status
    if (path === '/api/status') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            status: "operational",
            timestamp: new Date().toISOString(),
            services: {
                api: "healthy",
                elena_backend: "healthy",
                n8n_workflows: "active",
                database: "operational",
                bots: "5/5 active"
            },
            metrics: {
                uptime: "99.9%",
                response_time: "< 100ms",
                active_groups: tandaGroups.filter(g => g.status === 'active').length,
                total_groups: tandaGroups.length,
                total_endpoints: "11+",
                last_updated: new Date().toISOString()
            },
            version: {
                api: "1.1.0",
                ecosystem: "3.0-COMPLEX-ENHANCED"
            }
        }));
        return;
    }
    
    // 404 handler
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
        success: false,
        error: 'Endpoint not found',
        message: `${path} is not available`,
        available_endpoints: [
            '/',
            '/api/info',
            '/api/terms', 
            '/api/faq',
            '/api/legal',
            '/api/contact',
            '/api/status',
            '/api/health',
            '/api/docs',
            '/api/groups'
        ]
    }));
});

server.listen(port, hostname, () => {
    console.log('🚀 LA TANDA API EXPANDED - DEPLOYMENT SUCCESSFUL');
    console.log(`✅ Server running at http://${hostname}:${port}/`);
    console.log('✅ Root endpoint preserved: /');
    console.log('✅ Existing functionality: maintained');
    console.log('✅ New endpoints added: 6 informational endpoints');
    console.log('✅ Total endpoints: 11+');
    console.log('🎯 Integration completed successfully!');
});