/**
 * MIA Knowledge Base - La Tanda Ecosystem
 * Complete context for AI assistant
 */

const MIA_KNOWLEDGE = {
    identity: {
        name: 'MIA',
        fullName: 'MIA - Asistente Inteligente de La Tanda',
        personality: 'Amigable, profesional, conocedora del ecosistema financiero de La Tanda',
        language: 'Spanish (Honduras)',
        tone: 'Helpful, clear, encouraging'
    },
    
    platform: {
        name: 'La Tanda',
        description: 'Plataforma fintech Web3 que digitaliza las tandas tradicionales (asociaciones rotativas de ahorro y crédito) mediante tecnología blockchain.',
        mission: 'Democratizar el acceso a servicios financieros para comunidades desatendidas.',
        website: 'https://latanda.online',
        version: '3.52.0'
    },
    
    features: {
        tandas: {
            description: 'Sistema de ahorro rotativo donde grupos de personas aportan dinero periódicamente y cada ronda un miembro recibe el total.',
            benefits: ['Ahorro grupal', 'Sin intereses bancarios', 'Confianza comunitaria', 'Automatización con smart contracts']
        },
        wallet: {
            description: 'Billetera digital para gestionar LTD tokens y realizar transacciones.',
            features: ['Depósitos', 'Retiros', 'Transferencias', 'Historial de transacciones']
        },
        marketplace: {
            description: 'Mercado donde usuarios pueden comprar y vender productos usando LTD tokens.',
            categories: ['Productos', 'Servicios', 'Freelance']
        },
        lottery: {
            description: 'Sistema de lotería con predicciones basadas en análisis de datos históricos.',
            features: ['Predictor de números', 'Historial de sorteos', 'Estadísticas']
        },
        creatorHub: {
            description: 'Herramientas para creadores de contenido en la plataforma.',
            features: ['Analytics', 'Monetización', 'Gestión de contenido']
        }
    },
    
    token: {
        name: 'LTD',
        fullName: 'La Tanda Dollar',
        type: 'ERC20',
        network: 'Polygon Amoy (testnet)',
        contract: '0x8633212865B90FC0E44F1c41Fe97a3d2907d9cFc',
        totalSupply: '200,000,000 LTD',
        uses: ['Pagos en tandas', 'Compras en marketplace', 'Staking', 'Gobernanza', 'Recompensas']
    },
    
    blockchainStrategy: {
        phase1: {
            name: 'Polygon PoS Mainnet',
            timeline: 'Q2-Q3 2025',
            investment: '~USD 15,000',
            description: 'Lanzamiento en Polygon para validar el modelo con usuarios reales.'
        },
        phase2: {
            name: 'La Tanda Chain',
            timeline: 'Q4 2025+',
            investment: '~USD 453,500',
            validators: 21,
            consensus: 'DPoS (Delegated Proof of Stake)',
            description: 'Blockchain propia con validators distribuidos en Centroamérica.',
            nodeDistribution: {
                honduras: 7,
                guatemala: 4,
                elSalvador: 3,
                costaRica: 2,
                global: 5
            }
        }
    },
    
    pages: {
        'home-dashboard.html': 'Dashboard principal con feed social y accesos rápidos',
        'explorar.html': 'Descubrir contenido, cripto, noticias',
        'trabajo.html': 'Empleos, servicios, freelance',
        'creator-hub.html': 'Herramientas para creadores',
        'guardados.html': 'Items guardados/favoritos',
        'mensajes.html': 'Mensajería directa',
        'wallet.html': 'Billetera LTD',
        'groups-advanced-system.html': 'Gestión de tandas',
        'marketplace-search.html': 'Marketplace',
        'loteria.html': 'Lotería y predictor',
        'profile.html': 'Perfil de usuario',
        'settings.html': 'Configuración'
    },
    
    support: {
        email: 'soporte@latanda.online',
        discord: 'https://discord.com/channels/1429482603374710967',
        telegram: 'https://t.me/AhorroLaTanda'
    },
    
    commonQuestions: {
        'que es la tanda': 'La Tanda es una plataforma fintech que digitaliza las tandas tradicionales usando blockchain. Permite ahorrar en grupo de forma segura y transparente.',
        'como funciona una tanda': 'En una tanda, un grupo de personas aporta una cantidad fija periódicamente. Cada ronda, un miembro diferente recibe el total acumulado. Es un sistema de ahorro rotativo.',
        'que es ltd': 'LTD (La Tanda Dollar) es nuestro token de utilidad. Se usa para pagos en tandas, compras en el marketplace, staking y gobernanza.',
        'como compro ltd': 'Actualmente LTD está en testnet. Puedes obtener tokens de prueba en el faucet de la plataforma. En mainnet podrás comprar en exchanges.',
        'es seguro': 'Sí, usamos smart contracts auditados en Polygon, autenticación segura y encriptación de datos. Tus fondos están protegidos por la blockchain.',
        'como creo una tanda': 'Ve a Mis Tandas → Crear Tanda. Define el monto de contribución, frecuencia y número de participantes. Invita a tus amigos y comienza a ahorrar.',
        'como retiro dinero': 'En Mi Wallet puedes solicitar retiros. Los fondos se envían a tu cuenta bancaria o wallet externo según tu preferencia.'
    }
};

module.exports = MIA_KNOWLEDGE;
