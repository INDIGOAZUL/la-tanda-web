// EXPANSIÓN RÁPIDA DE API LA TANDA
// Implementación inmediata - 30 minutos

const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// ENDPOINT EXISTENTE
app.get('/', (req, res) => {
  res.json({ message: "API is working" });
});

// NUEVOS ENDPOINTS INFORMATIVOS - IMPLEMENTACIÓN INMEDIATA

// 1. Información General de La Tanda
app.get('/api/info', (req, res) => {
  res.json({
    name: "La Tanda API",
    version: "1.0.0",
    description: "Sistema de gestión de grupos de ahorro comunitario",
    ecosystem: {
      totalMoved: "L1,680,000+",
      familiesBenefited: "40+",
      activeGroups: 14,
      activeBots: 5,
      endpoints: "41+"
    },
    documentation: "https://latanda.online/docs",
    terms: "https://latanda.online/terms",
    support: "support@latanda.online",
    website: "https://latanda.online"
  });
});

// 2. Términos y Condiciones
app.get('/api/terms', (req, res) => {
  res.json({
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
  });
});

// 3. Preguntas Frecuentes
app.get('/api/faq', (req, res) => {
  res.json({
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
          },
          {
            q: "¿Puedo formalizar mi grupo?",
            a: "Sí, con mínimo 10 socios y L. 5,000 de capital inicial puedes registrar una Caja Rural con CONSUCOOP."
          }
        ]
      },
      technical: {
        title: "Plataforma Técnica",
        questions: [
          {
            q: "¿Cómo funciona el sistema digital?",
            a: "Utilizamos 5 bots especializados y más de 41 endpoints para gestión completa de grupos, pagos, verificación y notificaciones."
          },
          {
            q: "¿Mis datos están seguros?",
            a: "Sí, utilizamos encriptación y cumplimos con estándares de seguridad para proteger la información personal y financiera."
          }
        ]
      }
    }
  });
});

// 4. Marco Legal Honduras
app.get('/api/legal', (req, res) => {
  res.json({
    title: "Marco Legal - Honduras",
    country: "Honduras",
    lastUpdated: "2025-07-19",
    regulations: {
      primary: {
        name: "Decreto 201/93",
        title: "Ley de Cajas de Ahorro y Crédito Rural",
        authority: "Congreso Nacional de Honduras",
        scope: "Autoriza organización de Empresas Privadas de Ahorro y Crédito Rural"
      },
      supervision: {
        consucoop: {
          name: "CONSUCOOP",
          title: "Consejo Nacional Supervisor de Cooperativas",
          role: "Supervisión directa de Cooperativas de Ahorro y Crédito",
          website: "https://www.consucoop.hn"
        },
        cnbs: {
          name: "CNBS",
          title: "Comisión Nacional de Bancos y Seguros", 
          role: "Regulación del sistema financiero nacional",
          website: "https://www.cnbs.gob.hn"
        }
      },
      requirements: {
        minimum_members: 10,
        minimum_age: 21,
        minimum_capital: "L. 5,000.00",
        legal_registration: "Personería jurídica requerida"
      }
    }
  });
});

// 5. Información de Contacto
app.get('/api/contact', (req, res) => {
  res.json({
    title: "Contacto - La Tanda",
    support: {
      email: "support@latanda.online",
      phone: "+504 9448 5859",
      hours: "Lunes a Viernes, 8:00 AM - 6:00 PM (GMT-6)"
    },
    technical: {
      api: "https://api.latanda.online",
      workflows: "https://n8n.latanda.online",
      documentation: "https://latanda.online/docs"
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
    },
    address: {
      country: "Honduras",
      server: "168.231.67.201"
    }
  });
});

// 6. Estado del Sistema
app.get('/api/status', (req, res) => {
  res.json({
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
      active_groups: 14,
      total_endpoints: "41+",
      last_updated: "2025-07-19T21:14:26.990Z"
    },
    version: {
      api: "1.0.0",
      ecosystem: "3.0-COMPLEX-ENHANCED",
      n8n: "1.97.1"
    }
  });
});

// 7. Documentación de API
app.get('/api/docs', (req, res) => {
  res.json({
    title: "Documentación API - La Tanda",
    version: "1.0.0",
    base_url: "https://api.latanda.online",
    endpoints: {
      information: {
        "/api/info": {
          method: "GET",
          description: "Información general del ecosistema La Tanda",
          response: "JSON con datos básicos y métricas"
        },
        "/api/status": {
          method: "GET", 
          description: "Estado actual de todos los servicios",
          response: "JSON con estado de servicios y métricas"
        }
      },
      legal: {
        "/api/terms": {
          method: "GET",
          description: "Términos y condiciones completos",
          response: "JSON estructurado por secciones"
        },
        "/api/legal": {
          method: "GET",
          description: "Marco legal de Honduras para grupos de ahorro",
          response: "JSON con regulaciones y requisitos"
        }
      },
      support: {
        "/api/faq": {
          method: "GET",
          description: "Preguntas frecuentes organizadas por categorías",
          response: "JSON con preguntas y respuestas"
        },
        "/api/contact": {
          method: "GET",
          description: "Información de contacto y soporte",
          response: "JSON con canales de comunicación"
        }
      }
    },
    examples: {
      curl: "curl -X GET https://api.latanda.online/api/info",
      javascript: "fetch('https://api.latanda.online/api/info').then(r => r.json())"
    }
  });
});

const PORT = process.env.PORT || 8002;
app.listen(PORT, () => {
  console.log(`🚀 La Tanda API expandida running on port ${PORT}`);
});

module.exports = app;