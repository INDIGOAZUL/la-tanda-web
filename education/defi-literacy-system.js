/**
 * 📚 LA TANDA DEFI LITERACY & EDUCATION SYSTEM
 * Addressing strategic need for "user education and community building 
 * to preserve social trust elements" and "abstract blockchain complexity"
 */

class DeFiLiteracySystem {
    constructor() {
        this.learningModules = new Map();
        this.userProgress = new Map();
        this.assessments = new Map();
        this.certifications = new Map();
        this.communityMentors = new Map();
        
        // Learning paths for different user types
        this.learningPaths = {
            NEWCOMER: 'blockchain_basics',
            MEMBER: 'tanda_participation',
            COORDINATOR: 'group_management',
            ADVANCED: 'defi_strategies'
        };
        
        // Language support for Latin America
        this.supportedLanguages = ['es', 'en', 'pt', 'qu']; // Spanish, English, Portuguese, Quechua
        this.currentLanguage = 'es'; // Default to Spanish
        
        this.initializeEducationModules();
    }

    /**
     * Initialize comprehensive education modules
     */
    initializeEducationModules() {
        console.log('📚 Initializing DeFi Literacy Education Modules...');
        
        // Module 1: Blockchain Basics for Beginners
        this.createLearningModule('blockchain_basics', {
            title: {
                es: 'Fundamentos de Blockchain',
                en: 'Blockchain Fundamentals',
                pt: 'Fundamentos do Blockchain'
            },
            description: {
                es: 'Aprende los conceptos básicos de blockchain y criptomonedas',
                en: 'Learn the basic concepts of blockchain and cryptocurrencies',
                pt: 'Aprenda os conceitos básicos de blockchain e criptomoedas'
            },
            duration: 30, // minutes
            difficulty: 'BEGINNER',
            prerequisites: [],
            lessons: [
                {
                    id: 'what_is_blockchain',
                    title: {
                        es: '¿Qué es Blockchain?',
                        en: 'What is Blockchain?',
                        pt: 'O que é Blockchain?'
                    },
                    content: {
                        es: `
                        Blockchain es como un libro de contabilidad digital que:
                        • Es transparente - todos pueden ver las transacciones
                        • Es seguro - muy difícil de hackear o cambiar
                        • No necesita bancos - las personas pueden transaccionar directamente
                        • Mantiene un registro permanente de todas las transacciones
                        
                        Piensa en blockchain como un cuaderno compartido donde:
                        - Cada página es un "bloque" de transacciones
                        - Las páginas están numeradas y conectadas
                        - Todos tienen una copia idéntica del cuaderno
                        - Si alguien trata de cambiar algo, todos lo notarán
                        `,
                        en: `
                        Blockchain is like a digital ledger that:
                        • Is transparent - everyone can see transactions
                        • Is secure - very difficult to hack or change
                        • Doesn't need banks - people can transact directly
                        • Keeps a permanent record of all transactions
                        
                        Think of blockchain like a shared notebook where:
                        - Each page is a "block" of transactions
                        - Pages are numbered and connected
                        - Everyone has an identical copy of the notebook
                        - If someone tries to change something, everyone notices
                        `
                    },
                    interactive: {
                        type: 'simulation',
                        description: 'Interactive blockchain transaction simulator'
                    }
                },
                {
                    id: 'digital_wallets',
                    title: {
                        es: 'Billeteras Digitales',
                        en: 'Digital Wallets',
                        pt: 'Carteiras Digitais'
                    },
                    content: {
                        es: `
                        Una billetera digital es como tu billetera física, pero para dinero digital:
                        
                        🔐 SEGURIDAD:
                        • Tienes una "llave privada" (como una contraseña muy especial)
                        • NUNCA compartas tu llave privada con nadie
                        • Tu llave privada controla tu dinero
                        
                        📱 TIPOS DE BILLETERAS:
                        • Móvil: Apps en tu teléfono (MetaMask, Trust Wallet)
                        • Web: Sitios web en tu computadora
                        • Hardware: Dispositivos físicos (más seguro)
                        
                        💡 CONSEJOS IMPORTANTES:
                        • Escribe tu frase de recuperación en papel
                        • Guárdala en un lugar seguro
                        • Nunca la fotografíes o la pongas en tu teléfono
                        • Si pierdes tu llave privada, pierdes tu dinero para siempre
                        `
                    }
                }
            ]
        });

        // Module 2: Traditional Tandas vs Digital Tandas
        this.createLearningModule('tanda_evolution', {
            title: {
                es: 'De Tandas Tradicionales a Tandas Digitales',
                en: 'From Traditional to Digital Tandas'
            },
            duration: 25,
            difficulty: 'BEGINNER',
            lessons: [
                {
                    id: 'traditional_tandas',
                    title: {
                        es: 'Cómo Funcionan las Tandas Tradicionales',
                        en: 'How Traditional Tandas Work'
                    },
                    content: {
                        es: `
                        Las tandas tradicionales son círculos de ahorro y crédito donde:
                        
                        👥 GRUPO: 10-20 personas que se conocen y confían
                        💰 APORTE: Cada persona aporta la misma cantidad mensual
                        📅 ORDEN: Cada mes, una persona recibe todo el dinero
                        🤝 CONFIANZA: Basado en relaciones personales y reputación
                        
                        EJEMPLO:
                        • 10 personas en la tanda
                        • Cada una aporta $1,000 pesos mensual
                        • Total mensual: $10,000 pesos
                        • Cada mes, una persona diferente recibe los $10,000
                        • En 10 meses, todos han recibido su turno
                        
                        BENEFICIOS:
                        ✅ Acceso a crédito sin bancos
                        ✅ Disciplina de ahorro
                        ✅ Comunidad y apoyo social
                        ✅ Sin intereses ni trámites complicados
                        `
                    }
                },
                {
                    id: 'digital_advantages',
                    title: {
                        es: 'Ventajas de las Tandas Digitales',
                        en: 'Digital Tandas Advantages'
                    },
                    content: {
                        es: `
                        Las tandas digitales mantienen la esencia tradicional pero añaden:
                        
                        🔒 MAYOR SEGURIDAD:
                        • Contratos inteligentes automatizan los pagos
                        • Imposible que alguien se "vuele" con el dinero
                        • Transparencia total de todas las transacciones
                        
                        🌍 ACCESO GLOBAL:
                        • Puedes participar desde cualquier lugar
                        • Conecta con personas de confianza en otras ciudades
                        • Envíos instantáneos, sin bancos ni transferencias caras
                        
                        📊 TRANSPARENCIA:
                        • Todos pueden ver el estado de la tanda en tiempo real
                        • Historial completo e inmutable
                        • No hay "cuentas secretas" o manejo opaco del dinero
                        
                        💡 INNOVACIONES:
                        • Tandas programables con reglas personalizadas
                        • Seguros automáticos en caso de emergencias
                        • Recompensas por buen comportamiento
                        • Integración con otros servicios financieros
                        `
                    }
                }
            ]
        });

        // Module 3: Using La Tanda Platform
        this.createLearningModule('platform_usage', {
            title: {
                es: 'Cómo Usar la Plataforma La Tanda',
                en: 'How to Use La Tanda Platform'
            },
            duration: 45,
            difficulty: 'INTERMEDIATE',
            lessons: [
                {
                    id: 'getting_started',
                    title: {
                        es: 'Primeros Pasos',
                        en: 'Getting Started'
                    },
                    content: {
                        es: `
                        PASO A PASO PARA COMENZAR:
                        
                        1️⃣ CREAR CUENTA:
                        • Descarga MetaMask o usa billetera compatible
                        • Crea tu billetera digital
                        • Guarda tu frase de recuperación en lugar seguro
                        
                        2️⃣ VERIFICAR IDENTIDAD:
                        • Sube foto de tu identificación
                        • Selfie para verificar que eres tú
                        • Proporciona información básica
                        
                        3️⃣ CONSTRUIR CONFIANZA:
                        • Conecta con personas que conoces
                        • Pide verificaciones de amigos y familiares
                        • Completa tu perfil con información real
                        
                        4️⃣ OBTENER LTD TOKENS:
                        • Tokens gratis por verificar identidad
                        • Recompensas por invitar amigos
                        • Comprar con pesos mexicanos si necesitas más
                        
                        5️⃣ UNIRSE A PRIMERA TANDA:
                        • Comienza con una tanda pequeña
                        • Lee bien las reglas de la tanda
                        • Confirma que puedes cumplir con los pagos
                        `
                    }
                }
            ]
        });

        // Module 4: Security Best Practices
        this.createLearningModule('security_practices', {
            title: {
                es: 'Prácticas de Seguridad',
                en: 'Security Best Practices'
            },
            duration: 35,
            difficulty: 'INTERMEDIATE',
            lessons: [
                {
                    id: 'protecting_wallet',
                    title: {
                        es: 'Protegiendo Tu Billetera',
                        en: 'Protecting Your Wallet'
                    },
                    content: {
                        es: `
                        🚨 REGLAS DE ORO PARA SEGURIDAD:
                        
                        ❌ NUNCA HAGAS ESTO:
                        • Compartir tu frase de recuperación con nadie
                        • Tomarle foto a tu frase de recuperación
                        • Guardar tu frase en tu teléfono o computadora
                        • Enviar tu frase por mensaje o email
                        • Escribir tu frase en sitios web
                        
                        ✅ SIEMPRE HAZ ESTO:
                        • Escribe tu frase de recuperación en papel
                        • Guárdala en un lugar seguro (caja fuerte, banco)
                        • Haz una copia de respaldo en papel
                        • Verifica que escribiste correctamente
                        • Usa contraseñas fuertes diferentes para cada cuenta
                        
                        🔐 CONSEJOS ADICIONALES:
                        • Usa autenticación de dos factores (2FA)
                        • Mantén tu app de billetera actualizada
                        • Solo descarga apps de tiendas oficiales
                        • Nunca uses WiFi público para transacciones
                        • Si algo parece sospechoso, detente y pregunta
                        `
                    }
                }
            ]
        });

        console.log('✅ Education modules initialized');
    }

    /**
     * Create a learning module
     */
    createLearningModule(moduleId, moduleData) {
        this.learningModules.set(moduleId, {
            id: moduleId,
            ...moduleData,
            created: Date.now(),
            updated: Date.now(),
            enrollments: 0,
            completions: 0,
            averageRating: 0
        });
    }

    /**
     * Enroll user in learning path
     */
    async enrollUser(userAddress, learningPath = 'NEWCOMER') {
        console.log(`📖 Enrolling ${userAddress} in ${learningPath} learning path...`);
        
        const pathModules = this.getPathModules(learningPath);
        
        const userProgress = {
            userAddress,
            learningPath,
            enrolledAt: Date.now(),
            currentModule: pathModules[0],
            completedModules: [],
            currentLessonIndex: 0,
            totalProgress: 0,
            certificates: [],
            mentorAssigned: null,
            preferredLanguage: this.currentLanguage,
            studySchedule: {
                daysPerWeek: 3,
                minutesPerSession: 20,
                preferredTime: 'evening'
            }
        };
        
        this.userProgress.set(userAddress, userProgress);
        
        // Assign community mentor if available
        await this.assignMentor(userAddress);
        
        console.log(`✅ User enrolled in ${learningPath} path`);
        return userProgress;
    }

    /**
     * Get modules for learning path
     */
    getPathModules(learningPath) {
        const pathMappings = {
            NEWCOMER: ['blockchain_basics', 'tanda_evolution', 'platform_usage', 'security_practices'],
            MEMBER: ['platform_usage', 'security_practices', 'tanda_participation'],
            COORDINATOR: ['advanced_features', 'group_management', 'conflict_resolution'],
            ADVANCED: ['defi_strategies', 'yield_farming', 'governance_participation']
        };
        
        return pathMappings[learningPath] || pathMappings.NEWCOMER;
    }

    /**
     * Progress through learning content
     */
    async progressLesson(userAddress, moduleId, lessonId) {
        const progress = this.userProgress.get(userAddress);
        if (!progress) {
            throw new Error('User not enrolled in any learning path');
        }
        
        const module = this.learningModules.get(moduleId);
        if (!module) {
            throw new Error('Module not found');
        }
        
        console.log(`📚 User ${userAddress} progressing through ${moduleId}/${lessonId}`);
        
        // Mark lesson as completed
        const lessonKey = `${moduleId}_${lessonId}`;
        if (!progress.completedLessons) {
            progress.completedLessons = [];
        }
        
        if (!progress.completedLessons.includes(lessonKey)) {
            progress.completedLessons.push(lessonKey);
            
            // Award learning tokens
            await this.awardLearningTokens(userAddress, 10);
        }
        
        // Update progress
        this.updateUserProgress(userAddress);
        
        return {
            lessonCompleted: lessonKey,
            tokensAwarded: 10,
            nextLesson: this.getNextLesson(userAddress)
        };
    }

    /**
     * Take assessment quiz
     */
    async takeAssessment(userAddress, moduleId, answers) {
        console.log(`📝 Assessment for ${userAddress} on module ${moduleId}`);
        
        const module = this.learningModules.get(moduleId);
        if (!module) {
            throw new Error('Module not found');
        }
        
        // Grade assessment (simplified)
        const totalQuestions = answers.length;
        const correctAnswers = this.gradeAssessment(moduleId, answers);
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        const passed = score >= 70; // 70% pass rate
        
        const assessment = {
            userAddress,
            moduleId,
            score,
            passed,
            completedAt: Date.now(),
            attempts: 1
        };
        
        // Store assessment result
        const assessmentKey = `${userAddress}_${moduleId}`;
        this.assessments.set(assessmentKey, assessment);
        
        if (passed) {
            // Mark module as completed
            const progress = this.userProgress.get(userAddress);
            if (progress && !progress.completedModules.includes(moduleId)) {
                progress.completedModules.push(moduleId);
                
                // Award completion tokens
                await this.awardLearningTokens(userAddress, 50);
                
                // Check if eligible for certificate
                await this.checkCertificationEligibility(userAddress);
            }
        }
        
        console.log(`📊 Assessment result: ${score}% (${passed ? 'PASSED' : 'FAILED'})`);
        
        return {
            score,
            passed,
            tokensAwarded: passed ? 50 : 0,
            feedback: this.generateAssessmentFeedback(score, passed),
            nextSteps: this.getNextSteps(userAddress, passed)
        };
    }

    /**
     * Grade assessment answers
     */
    gradeAssessment(moduleId, answers) {
        // Simplified grading - in production would have actual answer keys
        const answerKeys = {
            blockchain_basics: ['A', 'B', 'C', 'A', 'B'],
            tanda_evolution: ['B', 'A', 'C', 'B', 'A'],
            platform_usage: ['A', 'C', 'B', 'A', 'C'],
            security_practices: ['B', 'A', 'A', 'C', 'B']
        };
        
        const correctAnswers = answerKeys[moduleId] || [];
        let score = 0;
        
        answers.forEach((answer, index) => {
            if (correctAnswers[index] === answer) {
                score++;
            }
        });
        
        return score;
    }

    /**
     * Assign community mentor
     */
    async assignMentor(userAddress) {
        // Find available mentors with matching language/region
        const availableMentors = Array.from(this.communityMentors.values())
            .filter(mentor => mentor.available && mentor.language === this.currentLanguage);
        
        if (availableMentors.length > 0) {
            const mentor = availableMentors[0]; // Simple assignment
            const progress = this.userProgress.get(userAddress);
            
            if (progress) {
                progress.mentorAssigned = mentor.address;
                mentor.currentMentees.push(userAddress);
                
                console.log(`👨‍🏫 Mentor ${mentor.address} assigned to ${userAddress}`);
                
                // Notify both parties
                await this.notifyMentorAssignment(userAddress, mentor.address);
            }
        }
    }

    /**
     * Create interactive learning experience
     */
    createInteractiveSimulation(type, config) {
        const simulations = {
            blockchain_transaction: {
                title: {
                    es: 'Simulador de Transacciones Blockchain',
                    en: 'Blockchain Transaction Simulator'
                },
                description: {
                    es: 'Practica enviando transacciones seguras sin usar dinero real',
                    en: 'Practice sending secure transactions without using real money'
                },
                steps: [
                    {
                        step: 1,
                        instruction: {
                            es: 'Selecciona la cantidad a enviar',
                            en: 'Select amount to send'
                        },
                        action: 'input_amount'
                    },
                    {
                        step: 2,
                        instruction: {
                            es: 'Ingresa la dirección del destinatario',
                            en: 'Enter recipient address'
                        },
                        action: 'input_address'
                    },
                    {
                        step: 3,
                        instruction: {
                            es: 'Revisa los detalles y confirma',
                            en: 'Review details and confirm'
                        },
                        action: 'confirm_transaction'
                    }
                ]
            },
            
            tanda_creation: {
                title: {
                    es: 'Simulador de Creación de Tanda',
                    en: 'Tanda Creation Simulator'
                },
                description: {
                    es: 'Aprende a crear y configurar una tanda digital',
                    en: 'Learn to create and configure a digital tanda'
                },
                steps: [
                    {
                        step: 1,
                        instruction: {
                            es: 'Define el monto de aporte mensual',
                            en: 'Set monthly contribution amount'
                        }
                    },
                    {
                        step: 2,
                        instruction: {
                            es: 'Establece el número de participantes',
                            en: 'Set number of participants'
                        }
                    },
                    {
                        step: 3,
                        instruction: {
                            es: 'Configura las reglas de la tanda',
                            en: 'Configure tanda rules'
                        }
                    }
                ]
            }
        };
        
        return simulations[type] || null;
    }

    /**
     * Generate personalized learning recommendations
     */
    generateLearningRecommendations(userAddress) {
        const progress = this.userProgress.get(userAddress);
        if (!progress) return [];
        
        const recommendations = [];
        
        // Based on completed modules
        if (progress.completedModules.includes('blockchain_basics')) {
            recommendations.push({
                type: 'next_module',
                priority: 'high',
                title: {
                    es: 'Continúa con Tandas Digitales',
                    en: 'Continue with Digital Tandas'
                },
                description: {
                    es: 'Aprende cómo las tandas tradicionales evolucionan en el mundo digital',
                    en: 'Learn how traditional tandas evolve in the digital world'
                }
            });
        }
        
        // Based on assessment scores
        const assessmentKey = `${userAddress}_security_practices`;
        const securityAssessment = this.assessments.get(assessmentKey);
        
        if (securityAssessment && securityAssessment.score < 80) {
            recommendations.push({
                type: 'review_content',
                priority: 'high',
                title: {
                    es: 'Refuerza tu Conocimiento de Seguridad',
                    en: 'Strengthen Your Security Knowledge'
                },
                description: {
                    es: 'La seguridad es fundamental. Revisa estos conceptos importantes.',
                    en: 'Security is fundamental. Review these important concepts.'
                }
            });
        }
        
        return recommendations;
    }

    /**
     * Award learning tokens for educational progress
     */
    async awardLearningTokens(userAddress, amount) {
        console.log(`🏆 Awarding ${amount} learning tokens to ${userAddress}`);
        
        // In production, this would interact with the LTD token contract
        // For now, just log the reward
        const progress = this.userProgress.get(userAddress);
        if (progress) {
            if (!progress.tokensEarned) progress.tokensEarned = 0;
            progress.tokensEarned += amount;
        }
        
        return { tokensAwarded: amount, totalEarned: progress?.tokensEarned || 0 };
    }

    /**
     * Check if user is eligible for certification
     */
    async checkCertificationEligibility(userAddress) {
        const progress = this.userProgress.get(userAddress);
        if (!progress) return false;
        
        const pathModules = this.getPathModules(progress.learningPath);
        const completedCount = progress.completedModules.length;
        const totalRequired = pathModules.length;
        
        if (completedCount >= totalRequired) {
            await this.issueCertificate(userAddress, progress.learningPath);
            return true;
        }
        
        return false;
    }

    /**
     * Issue learning certificate
     */
    async issueCertificate(userAddress, learningPath) {
        console.log(`🎓 Issuing certificate for ${userAddress} - ${learningPath} path`);
        
        const certificate = {
            id: this.generateCertificateId(),
            userAddress,
            learningPath,
            issuedAt: Date.now(),
            issuer: 'La Tanda Education System',
            skills: this.getCertificationSkills(learningPath),
            verificationHash: this.generateVerificationHash(userAddress, learningPath)
        };
        
        this.certifications.set(certificate.id, certificate);
        
        // Update user progress
        const progress = this.userProgress.get(userAddress);
        if (progress) {
            progress.certificates.push(certificate.id);
        }
        
        // Award certificate tokens
        await this.awardLearningTokens(userAddress, 100);
        
        console.log(`✅ Certificate ${certificate.id} issued successfully`);
        return certificate;
    }

    /**
     * Get skills covered by certification
     */
    getCertificationSkills(learningPath) {
        const skillMappings = {
            NEWCOMER: [
                'Blockchain Fundamentals',
                'Digital Wallet Security',
                'Traditional vs Digital Tandas',
                'Platform Usage Basics'
            ],
            MEMBER: [
                'Tanda Participation',
                'Risk Management',
                'Dispute Resolution',
                'Community Building'
            ],
            COORDINATOR: [
                'Group Leadership',
                'Financial Management',
                'Conflict Resolution',
                'Governance Participation'
            ]
        };
        
        return skillMappings[learningPath] || [];
    }

    /**
     * Create offline learning package
     */
    createOfflineLearningPackage(userAddress) {
        console.log(`📦 Creating offline learning package for ${userAddress}...`);
        
        const progress = this.userProgress.get(userAddress);
        if (!progress) {
            throw new Error('User not enrolled in learning path');
        }
        
        const currentModule = this.learningModules.get(progress.currentModule);
        
        const offlinePackage = {
            userAddress,
            packageId: this.generatePackageId(),
            createdAt: Date.now(),
            language: progress.preferredLanguage,
            content: {
                currentModule: {
                    id: currentModule.id,
                    title: currentModule.title[progress.preferredLanguage],
                    lessons: currentModule.lessons.map(lesson => ({
                        id: lesson.id,
                        title: lesson.title[progress.preferredLanguage],
                        content: lesson.content[progress.preferredLanguage],
                        // Remove interactive elements for offline use
                        hasInteractive: !!lesson.interactive
                    }))
                },
                assessments: this.getOfflineAssessments(progress.currentModule),
                resources: this.getOfflineResources(progress.preferredLanguage)
            },
            syncRequired: true
        };
        
        console.log(`✅ Offline package created: ${offlinePackage.packageId}`);
        return offlinePackage;
    }

    /**
     * Sync offline progress when user comes back online
     */
    async syncOfflineProgress(userAddress, offlineData) {
        console.log(`🔄 Syncing offline progress for ${userAddress}...`);
        
        const progress = this.userProgress.get(userAddress);
        if (!progress) {
            throw new Error('User progress not found');
        }
        
        let tokensAwarded = 0;
        
        // Process completed lessons
        if (offlineData.completedLessons) {
            for (const lessonKey of offlineData.completedLessons) {
                if (!progress.completedLessons.includes(lessonKey)) {
                    progress.completedLessons.push(lessonKey);
                    tokensAwarded += 10;
                }
            }
        }
        
        // Process assessments
        if (offlineData.assessments) {
            for (const assessment of offlineData.assessments) {
                await this.takeAssessment(userAddress, assessment.moduleId, assessment.answers);
            }
        }
        
        // Award tokens for offline learning
        if (tokensAwarded > 0) {
            await this.awardLearningTokens(userAddress, tokensAwarded);
        }
        
        console.log(`✅ Offline progress synced, ${tokensAwarded} tokens awarded`);
        return { tokensAwarded, lessonsCompleted: offlineData.completedLessons?.length || 0 };
    }

    /**
     * Get user's learning dashboard
     */
    getLearningDashboard(userAddress) {
        const progress = this.userProgress.get(userAddress);
        if (!progress) return null;
        
        const pathModules = this.getPathModules(progress.learningPath);
        const completionPercentage = Math.round((progress.completedModules.length / pathModules.length) * 100);
        
        return {
            userAddress,
            learningPath: progress.learningPath,
            completionPercentage,
            currentModule: progress.currentModule,
            completedModules: progress.completedModules.length,
            totalModules: pathModules.length,
            tokensEarned: progress.tokensEarned || 0,
            certificates: progress.certificates.length,
            mentorAssigned: progress.mentorAssigned,
            studyStreak: this.calculateStudyStreak(userAddress),
            nextMilestone: this.getNextMilestone(userAddress),
            recommendations: this.generateLearningRecommendations(userAddress)
        };
    }

    // Utility methods
    updateUserProgress(userAddress) {
        const progress = this.userProgress.get(userAddress);
        if (progress) {
            const pathModules = this.getPathModules(progress.learningPath);
            progress.totalProgress = Math.round((progress.completedModules.length / pathModules.length) * 100);
        }
    }

    getNextLesson(userAddress) {
        // Implementation for determining next lesson
        return 'Next lesson logic here';
    }

    generateAssessmentFeedback(score, passed) {
        if (passed) {
            return {
                es: `¡Excelente! Obtuviste ${score}% y has aprobado el módulo.`,
                en: `Excellent! You scored ${score}% and passed the module.`
            };
        } else {
            return {
                es: `Obtuviste ${score}%. Necesitas 70% para aprobar. ¡Sigue practicando!`,
                en: `You scored ${score}%. You need 70% to pass. Keep practicing!`
            };
        }
    }

    getNextSteps(userAddress, passed) {
        if (passed) {
            return {
                es: 'Continúa con el siguiente módulo',
                en: 'Continue to the next module'
            };
        } else {
            return {
                es: 'Revisa el contenido y vuelve a intentar',
                en: 'Review the content and try again'
            };
        }
    }

    notifyMentorAssignment(userAddress, mentorAddress) {
        console.log(`📧 Notifying mentor assignment: ${mentorAddress} -> ${userAddress}`);
    }

    calculateStudyStreak(userAddress) {
        // Calculate consecutive days of learning activity
        return Math.floor(Math.random() * 15) + 1; // Simulated
    }

    getNextMilestone(userAddress) {
        const progress = this.userProgress.get(userAddress);
        if (!progress) return null;
        
        const pathModules = this.getPathModules(progress.learningPath);
        const remaining = pathModules.length - progress.completedModules.length;
        
        if (remaining === 0) {
            return { type: 'certification', description: 'Ready for certification!' };
        } else {
            return { type: 'module_completion', description: `${remaining} modules remaining` };
        }
    }

    getOfflineAssessments(moduleId) {
        // Return simplified assessments for offline use
        return [];
    }

    getOfflineResources(language) {
        return {
            glossary: 'Blockchain terms and definitions',
            faq: 'Frequently asked questions',
            troubleshooting: 'Common issues and solutions'
        };
    }

    generateCertificateId() {
        return `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateVerificationHash(userAddress, learningPath) {
        return `hash_${userAddress}_${learningPath}_${Date.now()}`;
    }

    generatePackageId() {
        return `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
}

module.exports = DeFiLiteracySystem;

// Example usage
if (require.main === module) {
    const educationSystem = new DeFiLiteracySystem();
    
    async function demonstrateEducationSystem() {
        console.log('🎓 Demonstrating DeFi Literacy System...\n');
        
        const userAddress = '0x742d35Cc6634C0532925a3b8D4C4F2bD1096B0cD';
        
        // Enroll user
        await educationSystem.enrollUser(userAddress, 'NEWCOMER');
        
        // Progress through lessons
        await educationSystem.progressLesson(userAddress, 'blockchain_basics', 'what_is_blockchain');
        await educationSystem.progressLesson(userAddress, 'blockchain_basics', 'digital_wallets');
        
        // Take assessment
        const assessmentResult = await educationSystem.takeAssessment(
            userAddress, 
            'blockchain_basics', 
            ['A', 'B', 'C', 'A', 'B']
        );
        console.log('Assessment Result:', assessmentResult);
        
        // Get dashboard
        const dashboard = educationSystem.getLearningDashboard(userAddress);
        console.log('\nLearning Dashboard:', dashboard);
        
        // Create offline package
        const offlinePackage = educationSystem.createOfflineLearningPackage(userAddress);
        console.log('\nOffline Package Created:', offlinePackage.packageId);
        
        console.log('\n✅ DeFi Literacy System demonstration completed!');
    }
    
    demonstrateEducationSystem().catch(console.error);
}