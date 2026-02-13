/**
 * Simple API Proxy for Local Development
 * Handles CORS issues when testing from localhost
 */

class APIProxy {
    constructor() {
        this.API_BASE = 'https://api.latanda.online/api';
        this.isProxy = true;
    }

    async makeRequest(endpoint, options = {}) {
        // For local testing, we'll use simulated responses directly
        // to avoid CORS and network issues
        
        console.log(`🔍 API Proxy: ${options.method || 'GET'} ${endpoint}`);
        
        try {
            // For local development, use simulation directly
            // This avoids CORS issues and network timeouts
            const simulatedResponse = this.getSimulatedResponse(endpoint, options);
            
            console.log(`✅ API Proxy simulation for ${endpoint}:`, simulatedResponse);
            
            return simulatedResponse;
            
        } catch (error) {
            console.error(`❌ API Proxy error for ${endpoint}:`, error);
            
            // Return error response in expected format
            return {
                success: false,
                error: {
                    message: error.message || 'API proxy error',
                    code: 500,
                    endpoint: endpoint
                },
                meta: {
                    timestamp: new Date().toISOString(),
                    version: "2.0.0",
                    server: "simulated-for-cors",
                    environment: "local-testing"
                }
            };
        }
    }

    getSimulatedResponse(endpoint, options) {
        const method = options.method || 'GET';
        const now = new Date().toISOString();
        
        // Extract the base endpoint without query parameters for switch matching
        const baseEndpoint = endpoint.split('?')[0];
        
        // Simulate successful responses based on endpoint
        switch (baseEndpoint) {
            case '/system/status':
                return {
                    success: true,
                    data: {
                        system: "healthy",
                        uptime: 669715.331219392,
                        endpoints: 85,
                        database: "connected",
                        mobile_services: {
                            push_notifications: "active",
                            offline_sync: "active",
                            mia_assistant: "active",
                            real_time_updates: "active"
                        },
                        performance: {
                            avg_response_time: "150ms",
                            requests_per_minute: 45,
                            error_rate: "0.1%"
                        }
                    },
                    meta: {
                        timestamp: now,
                        version: "2.0.0",
                        server: "simulated-for-cors",
                        environment: "local-testing"
                    }
                };

            case '/auth/register':
                if (method === 'POST') {
                    const body = JSON.parse(options.body || '{}');
                    const userEmail = body.email || "test@example.com";
                    const userName = body.name || "Test User";
                    const userPassword = body.password || "defaultpass";
                    
                    // Store user credentials in localStorage for demo purposes
                    this.storeUserCredentials(userEmail, userPassword, {
                        id: `user_${Math.random().toString(36).substr(2, 16)}`,
                        name: userName,
                        email: userEmail,
                        verification_level: "basic",
                        registration_date: now,
                        status: "active",
                        role: "user"
                    });
                    
                    return {
                        success: true,
                        data: {
                            message: "Registro exitoso",
                            user: {
                                id: `user_${Math.random().toString(36).substr(2, 16)}`,
                                name: userName,
                                email: userEmail,
                                verification_level: "basic",
                                registration_date: now,
                                status: "active",
                                role: "user"
                            },
                            auth_token: this.generateJWT({
                                user_id: `user_${Math.random().toString(36).substr(2, 16)}`,
                                email: userEmail,
                                role: "user",
                                permissions: ["user_access"],
                                iss: "latanda.online", // issuer (REQUIRED for auth validation)
                                aud: "latanda-web-app", // audience (REQUIRED for auth validation)
                                iat: Math.floor(Date.now() / 1000), // issued at (REQUIRED)
                                exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
                            }),
                            next_step: "Verificar número de teléfono"
                        },
                        meta: {
                            timestamp: now,
                            version: "2.0.0",
                            server: "simulated-for-cors",
                            environment: "local-testing"
                        }
                    };
                }
                break;

            case '/auth/login':
                if (method === 'POST') {
                    const body = JSON.parse(options.body || '{}');
                    const userEmail = body.email || "";
                    const userPassword = body.password || "";
                    
                    // Check registered users first
                    const registeredUser = this.validateUserCredentials(userEmail, userPassword);
                    if (registeredUser) {
                        return {
                            success: true,
                            data: {
                                message: "Login exitoso",
                                user: registeredUser,
                                auth_token: this.generateJWT({
                                    user_id: registeredUser.id,
                                    email: userEmail,
                                    role: registeredUser.role,
                                    permissions: registeredUser.permissions || ["user_access"],
                                    iss: "latanda.online", // issuer (REQUIRED for auth validation)
                                    aud: "latanda-web-app", // audience (REQUIRED for auth validation)
                                    iat: Math.floor(Date.now() / 1000), // issued at (REQUIRED)
                                    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
                                }),
                                session_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                                dashboard_url: "/home-dashboard.html"
                            },
                            meta: {
                                timestamp: now,
                                version: "2.0.0",
                                server: "simulated-for-cors",
                                environment: "local-testing"
                            }
                        };
                    }
                    
                    // Admin credentials
                    if (userEmail === 'admin@latanda.online' && userPassword === 'REMOVED_CREDENTIAL') {
                        return {
                            success: true,
                            data: {
                                message: "Login exitoso - Administrador",
                                user: {
                                    id: "admin_001",
                                    name: "Administrador Sistema",
                                    email: userEmail,
                                    verification_level: "admin",
                                    role: "admin",
                                    permissions: [
                                        "full_access",
                                        "user_management", 
                                        "system_config",
                                        "financial_operations",
                                        "data_export",
                                        "security_admin"
                                    ],
                                    login_date: now,
                                    status: "active"
                                },
                                auth_token: this.generateJWT({
                                    user_id: "admin_001",
                                    email: userEmail,
                                    role: "admin",
                                    permissions: ["full_access", "user_management", "system_config"],
                                    iss: "latanda.online", // issuer (REQUIRED for auth validation)
                                    aud: "latanda-web-app", // audience (REQUIRED for auth validation)
                                    iat: Math.floor(Date.now() / 1000), // issued at (REQUIRED)
                                    exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours
                                }),
                                session_expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
                                dashboard_url: "/home-dashboard.html"
                            },
                            meta: {
                                timestamp: now,
                                version: "2.0.0",
                                server: "simulated-for-cors",
                                environment: "local-testing"
                            }
                        };
                    }
                    
                    // Demo credentials
                    if (userEmail === 'user@example.com' && userPassword === 'REMOVED_CREDENTIAL') {
                        return {
                            success: true,
                            data: {
                                message: "Login exitoso - Demo",
                                user: {
                                    id: "demo_001",
                                    name: "Usuario Demo",
                                    email: userEmail,
                                    verification_level: "demo",
                                    role: "demo_user",
                                    permissions: ["read_only", "demo_access"],
                                    login_date: now,
                                    status: "active"
                                },
                                auth_token: this.generateJWT({
                                    user_id: "demo_001",
                                    email: userEmail,
                                    role: "demo_user",
                                    permissions: ["read_only", "demo_access"],
                                    iss: "latanda.online", // issuer (REQUIRED for auth validation)
                                    aud: "latanda-web-app", // audience (REQUIRED for auth validation)
                                    iat: Math.floor(Date.now() / 1000), // issued at (REQUIRED)
                                    exp: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // 2 hours
                                }),
                                session_expires: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
                                dashboard_url: "/home-dashboard.html"
                            },
                            meta: {
                                timestamp: now,
                                version: "2.0.0",
                                server: "simulated-for-cors",
                                environment: "local-testing"
                            }
                        };
                    }
                    
                    // Invalid credentials
                    return {
                        success: false,
                        error: {
                            code: 401,
                            message: "Credenciales inválidas",
                            details: "Email o contraseña incorrectos"
                        },
                        meta: {
                            timestamp: now,
                            version: "2.0.0",
                            server: "simulated-for-cors",
                            environment: "local-testing"
                        }
                    };
                }
                break;

            case '/auth/admin/register':
                if (method === 'POST') {
                    const body = JSON.parse(options.body || '{}');
                    
                    return {
                        success: true,
                        data: {
                            message: "Cuenta de administrador creada exitosamente",
                            user: {
                                id: `admin_${Math.random().toString(36).substr(2, 16)}`,
                                name: body.name || "Administrador",
                                email: body.email || "admin@latanda.online",
                                verification_level: "admin",
                                role: "admin",
                                permissions: [
                                    "full_access",
                                    "user_management", 
                                    "system_config",
                                    "financial_operations",
                                    "data_export",
                                    "security_admin"
                                ],
                                registration_date: now,
                                status: "active",
                                created_by: "system"
                            },
                            auth_token: this.generateJWT({
                                user_id: `admin_${Math.random().toString(36).substr(2, 16)}`,
                                email: body.email || "admin@latanda.online",
                                role: "admin",
                                permissions: ["full_access", "user_management", "system_config"],
                                iss: "latanda.online", // issuer (REQUIRED for auth validation)
                                aud: "latanda-web-app", // audience (REQUIRED for auth validation)
                                iat: Math.floor(Date.now() / 1000), // issued at (REQUIRED)
                                exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60) // 8 hours
                            }),
                            setup_required: {
                                two_factor_auth: true,
                                security_questions: true,
                                backup_codes: true
                            }
                        },
                        meta: {
                            timestamp: now,
                            version: "2.0.0",
                            server: "simulated-for-cors",
                            environment: "local-testing"
                        }
                    };
                }
                break;

            case '/verification/phone/send':
                if (method === 'POST') {
                    return {
                        success: true,
                        data: {
                            message: "Código de verificación enviado (simulado)",
                            verification_id: `verify_${Math.random().toString(36).substr(2, 16)}`,
                            expires_in: 600
                        },
                        meta: {
                            timestamp: now,
                            version: "2.0.0",
                            server: "simulated-for-cors",
                            environment: "local-testing"
                        }
                    };
                }
                break;

            case '/payments/process':
                if (method === 'POST') {
                    const body = JSON.parse(options.body || '{}');
                    const amount = body.amount || 100;
                    
                    return {
                        success: true,
                        data: {
                            id: `payment_${Math.random().toString(36).substr(2, 16)}`,
                            amount: amount,
                            status: "completed",
                            transaction_date: now,
                            confirmation_code: `CONF${Math.floor(Math.random() * 1000000)}`,
                            estimated_completion: new Date(Date.now() + 300000).toISOString(),
                            group_id: body.group_id,
                            user_id: body.user_id,
                            currency: body.currency || 'HNL',
                            payment_method: body.payment_method || 'test'
                        },
                        meta: {
                            timestamp: now,
                            version: "2.0.0",
                            server: "simulated-for-cors",
                            environment: "local-testing"
                        }
                    };
                }
                break;

            case '/groups':
                return {
                    success: true,
                    data: [
                        {
                            id: `group_${Math.random().toString(36).substr(2, 16)}`,
                            name: "Test Group (Simulated)",
                            contribution_amount: 500,
                            frequency: "weekly",
                            member_count: 3,
                            max_members: 8,
                            total_amount_collected: 1500,
                            admin_name: "Test Admin",
                            status: "active",
                            created_at: now,
                            location: "Honduras",
                            description: "Simulated test group for CORS testing",
                            category: "test"
                        }
                    ],
                    meta: {
                        timestamp: now,
                        version: "2.0.0",
                        server: "simulated-for-cors",
                        environment: "local-testing",
                        total: 1
                    }
                };

            case '/registration/groups/create':
                if (method === 'POST') {
                    const groupId = `group_${Math.random().toString(36).substr(2, 16)}`;
                    return {
                        success: true,
                        data: {
                            group: {
                                id: groupId,
                                name: "Phase 3 Test Group (Simulated)",
                                contribution_amount: 500,
                                frequency: "weekly",
                                member_count: 1,
                                max_members: 8,
                                total_amount_collected: 0,
                                admin_name: "Test User",
                                status: "active",
                                created_at: now,
                                location: "Honduras",
                                description: "Simulated group creation for testing",
                                category: "test"
                            },
                            message: "Grupo creado exitosamente (simulado)"
                        },
                        meta: {
                            timestamp: now,
                            version: "2.0.0",
                            server: "simulated-for-cors",
                            environment: "local-testing"
                        }
                    };
                }
                break;

            // Lottery System Endpoints
            case '/lottery/conduct':
                if (method === 'POST') {
                    const body = JSON.parse(options.body || '{}');
                    const members = body.members || [];
                    const groupId = body.group_id || `group_${Date.now()}`;
                    
                    // Generate lottery results
                    const lotteryResults = members.map(memberId => ({
                        user_id: memberId,
                        lottery_number: Math.floor(Math.random() * 1000) + 1,
                        turn_position: 0, // Will be assigned after sorting
                        drawn_at: now
                    }));
                    
                    // Sort by lottery number
                    lotteryResults.sort((a, b) => a.lottery_number - b.lottery_number);
                    
                    // Assign turn positions
                    lotteryResults.forEach((result, index) => {
                        result.turn_position = index + 1;
                    });
                    
                    return {
                        success: true,
                        data: {
                            lottery_id: `lottery_${Math.random().toString(36).substr(2, 16)}`,
                            group_id: groupId,
                            conducted_at: now,
                            total_participants: members.length,
                            lottery_method: "random_number_generation",
                            results: lotteryResults,
                            fairness_score: Math.floor(Math.random() * 20) + 80, // 80-100
                            next_recipient: lotteryResults[0]
                        },
                        meta: {
                            timestamp: now,
                            version: "2.0.0",
                            server: "simulated-for-cors",
                            environment: "local-testing"
                        }
                    };
                }
                break;

            case '/lottery/status':
                if (method === 'GET') {
                    const groupId = options.params?.group_id || 'test_group';
                    return {
                        success: true,
                        data: {
                            group_id: groupId,
                            lottery_conducted: true,
                            conducted_at: now,
                            total_members: 5,
                            completed_turns: 2,
                            remaining_turns: 3,
                            current_turn: 3,
                            progress_percentage: 40,
                            is_complete: false,
                            next_recipient: {
                                user_id: "test_user_3",
                                turn_position: 3,
                                lottery_number: 456,
                                expected_payout_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                            }
                        },
                        meta: {
                            timestamp: now,
                            version: "2.0.0",
                            server: "simulated-for-cors",
                            environment: "local-testing"
                        }
                    };
                }
                break;

            case '/lottery/reconduct':
                if (method === 'POST') {
                    const body = JSON.parse(options.body || '{}');
                    const groupId = body.group_id || 'test_group';
                    const reason = body.reason || 'User requested re-lottery';
                    const remainingMembers = body.remaining_members || [];
                    
                    // Generate new lottery for remaining members
                    const newResults = remainingMembers.map(memberId => ({
                        user_id: memberId,
                        lottery_number: Math.floor(Math.random() * 1000) + 1,
                        turn_position: 0,
                        drawn_at: now,
                        is_redrawn: true
                    }));
                    
                    newResults.sort((a, b) => a.lottery_number - b.lottery_number);
                    
                    return {
                        success: true,
                        data: {
                            lottery_id: `lottery_rerun_${Math.random().toString(36).substr(2, 16)}`,
                            group_id: groupId,
                            reconducted_at: now,
                            reason: reason,
                            affected_members: remainingMembers.length,
                            new_results: newResults,
                            message: "Lottery re-conducted successfully for remaining members"
                        },
                        meta: {
                            timestamp: now,
                            version: "2.0.0",
                            server: "simulated-for-cors",
                            environment: "local-testing"
                        }
                    };
                }
                break;

            case '/lottery/validate':
                if (method === 'POST') {
                    const body = JSON.parse(options.body || '{}');
                    const lotteryResults = body.results || [];
                    
                    // Validate lottery results
                    const validation = {
                        is_valid: true,
                        fairness_score: Math.floor(Math.random() * 20) + 80,
                        duplicate_numbers: [],
                        missing_members: [],
                        statistical_analysis: {
                            mean_lottery_number: lotteryResults.reduce((sum, r) => sum + r.lottery_number, 0) / lotteryResults.length,
                            number_distribution: "acceptable",
                            randomness_quality: "high"
                        }
                    };
                    
                    return {
                        success: true,
                        data: validation,
                        meta: {
                            timestamp: now,
                            version: "2.0.0",
                            server: "simulated-for-cors",
                            environment: "local-testing"
                        }
                    };
                }
                break;

            // Turn Management Endpoints
            case '/turns/assign':
                if (method === 'POST') {
                    const body = JSON.parse(options.body || '{}');
                    const groupId = body.group_id || 'test_group';
                    const lotteryResults = body.lottery_results || [];
                    
                    const turnAssignments = lotteryResults.map((result, index) => ({
                        user_id: result.user_id,
                        group_id: groupId,
                        turn_number: index + 1,
                        lottery_number: result.lottery_number,
                        assigned_at: now,
                        status: index === 0 ? 'current' : 'pending',
                        expected_payout_date: new Date(Date.now() + (index * 7 * 24 * 60 * 60 * 1000)).toISOString()
                    }));
                    
                    return {
                        success: true,
                        data: {
                            group_id: groupId,
                            total_turns: turnAssignments.length,
                            assignments: turnAssignments,
                            message: "Turn assignments created successfully"
                        },
                        meta: {
                            timestamp: now,
                            version: "2.0.0",
                            server: "simulated-for-cors",
                            environment: "local-testing"
                        }
                    };
                }
                break;

            case '/turns/complete':
                if (method === 'POST') {
                    const body = JSON.parse(options.body || '{}');
                    const groupId = body.group_id || 'test_group';
                    const userId = body.user_id || 'test_user';
                    const payoutAmount = body.payout_amount || 5000;
                    
                    return {
                        success: true,
                        data: {
                            turn_completed: true,
                            group_id: groupId,
                            user_id: userId,
                            payout_amount: payoutAmount,
                            completed_at: now,
                            transaction_id: `txn_${Math.random().toString(36).substr(2, 16)}`,
                            next_recipient: {
                                user_id: "next_user",
                                turn_number: 2,
                                lottery_number: 789
                            },
                            cycle_status: {
                                is_complete: false,
                                progress_percentage: 25,
                                remaining_turns: 3
                            }
                        },
                        meta: {
                            timestamp: now,
                            version: "2.0.0",
                            server: "simulated-for-cors",
                            environment: "local-testing"
                        }
                    };
                }
                break;

            case '/turns/member-info':
                // Handle both GET with query params and GET with URL params
                const urlParts = endpoint.split('?');
                const queryString = urlParts[1] || '';
                const params = new URLSearchParams(queryString);
                
                const groupId = params.get('group_id') || options.params?.group_id || 'test_group';
                const userId = params.get('user_id') || options.params?.user_id || 'María_González';
                
                return {
                    success: true,
                    data: {
                        user_id: userId,
                        group_id: groupId,
                        turn_number: 3,
                        lottery_number: 456,
                        status: 'pending',
                        is_next: false,
                        turns_until_payout: 1,
                        expected_payout_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        estimated_payout_amount: 2500
                    },
                    meta: {
                        timestamp: now,
                        version: "2.0.0",
                        server: "simulated-for-cors",
                        environment: "local-testing"
                    }
                };

            // Dashboard data endpoints
            case '/user/profile':
                return {
                    success: true,
                    data: {
                        id: "admin_001",
                        name: "Administrador Sistema", 
                        email: "admin@latanda.online",
                        role: "admin",
                        verification_level: "admin",
                        profile_image: "/darckfield 2 latanda.png",
                        joined_date: "2024-01-15",
                        last_login: new Date().toISOString(),
                        permissions: ["full_access", "user_management", "system_config"],
                        settings: {
                            notifications: true,
                            language: "es",
                            theme: "dark"
                        }
                    },
                    meta: {
                        timestamp: now,
                        version: "2.0.0", 
                        server: "simulated-for-cors",
                        environment: "local-testing"
                    }
                };

            case '/user/stats':
                return {
                    success: true,
                    data: {
                        total_tandas: 12,
                        active_tandas: 3,
                        completed_tandas: 9,
                        total_contributed: 45000,
                        total_received: 15000,
                        success_rate: 100,
                        reputation_score: 98,
                        referrals_made: 5,
                        commission_earned: 1250
                    },
                    meta: {
                        timestamp: now,
                        version: "2.0.0",
                        server: "simulated-for-cors", 
                        environment: "local-testing"
                    }
                };

            case '/tandas/list':
                return {
                    success: true,
                    data: [
                        {
                            id: "tanda_001",
                            name: "Tanda Familiar Enero",
                            amount: 5000,
                            participants: 10,
                            frequency: "monthly",
                            status: "active",
                            next_payout: "2025-09-01",
                            my_position: 3,
                            progress: 30
                        },
                        {
                            id: "tanda_002", 
                            name: "Tanda Oficina Q1",
                            amount: 10000,
                            participants: 8,
                            frequency: "weekly",
                            status: "active",
                            next_payout: "2025-08-19",
                            my_position: 1,
                            progress: 75
                        },
                        {
                            id: "tanda_003",
                            name: "Tanda Comunidad",
                            amount: 3000,
                            participants: 15,
                            frequency: "bi-weekly", 
                            status: "completed",
                            completed_date: "2025-07-15",
                            my_position: 7,
                            progress: 100
                        }
                    ],
                    meta: {
                        timestamp: now,
                        version: "2.0.0",
                        server: "simulated-for-cors",
                        environment: "local-testing"
                    }
                };

            case '/transactions/list':
                return {
                    success: true,
                    data: [
                        {
                            id: "tx_001",
                            type: "contribution",
                            amount: 5000,
                            date: "2025-08-10T10:30:00Z",
                            status: "completed",
                            description: "Contribución Tanda Familiar",
                            reference: "TF-2025-08-001"
                        },
                        {
                            id: "tx_002", 
                            type: "payout",
                            amount: 15000,
                            date: "2025-08-05T14:15:00Z", 
                            status: "completed",
                            description: "Pago recibido - Tanda Oficina",
                            reference: "TO-2025-08-002"
                        },
                        {
                            id: "tx_003",
                            type: "commission",
                            amount: 250,
                            date: "2025-08-01T09:00:00Z",
                            status: "completed", 
                            description: "Comisión por referido",
                            reference: "COM-2025-08-001"
                        }
                    ],
                    meta: {
                        timestamp: now,
                        version: "2.0.0",
                        server: "simulated-for-cors",
                        environment: "local-testing"
                    }
                };

            case '/ltd/balance':
                return {
                    success: true,
                    data: {
                        balance: 2500,
                        staked: 1000,
                        available: 1500,
                        pending_rewards: 125,
                        total_earned: 3750,
                        token_price: 1.25,
                        market_cap: 125000000,
                        your_percentage: 0.002,
                        staking_apy: 12.5,
                        next_reward: "2025-08-15T00:00:00Z"
                    },
                    meta: {
                        timestamp: now,
                        version: "2.0.0",
                        server: "simulated-for-cors",
                        environment: "local-testing"
                    }
                };

            default:
                return {
                    success: false,
                    error: {
                        code: 404,
                        message: "Endpoint not found in simulation",
                        details: {
                            requested_path: endpoint,
                            method: method,
                            note: "This is a simulated response due to CORS"
                        }
                    },
                    meta: {
                        timestamp: now,
                        version: "2.0.0",
                        server: "simulated-for-cors",
                        environment: "local-testing"
                    }
                };
        }

        return {
            success: false,
            error: {
                message: "Method not simulated",
                endpoint: endpoint,
                method: method
            }
        };
    }

    // Generate a proper JWT token for development/testing
    generateJWT(payload) {
        // Create header
        const header = {
            "alg": "HS256",
            "typ": "JWT"
        };

        // Use standard Base64 encoding (compatible with atob())
        const encodedHeader = btoa(JSON.stringify(header));
        const encodedPayload = btoa(JSON.stringify(payload));
        
        // For development, create a simple signature (in production this would be properly signed)
        const signature = btoa(`signature_${Math.random().toString(36).substr(2, 20)}`);
        
        // Return properly formatted JWT: header.payload.signature
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    // Store user credentials in localStorage (for demo purposes)
    storeUserCredentials(email, password, userData) {
        try {
            const users = JSON.parse(localStorage.getItem('latanda_registered_users') || '{}');
            users[email] = {
                password: password, // In production, this would be hashed
                userData: userData,
                registeredAt: new Date().toISOString()
            };
            localStorage.setItem('latanda_registered_users', JSON.stringify(users));
            console.log(`📝 User registered: ${email}`);
        } catch (error) {
            console.error('Error storing user credentials:', error);
        }
    }

    // Validate user credentials
    validateUserCredentials(email, password) {
        try {
            const users = JSON.parse(localStorage.getItem('latanda_registered_users') || '{}');
            const user = users[email];
            
            if (user && user.password === password) {
                console.log(`✅ User credentials valid: ${email}`);
                return user.userData;
            }
            
            console.log(`❌ Invalid credentials for: ${email}`);
            return null;
        } catch (error) {
            console.error('Error validating user credentials:', error);
            return null;
        }
    }

    // Get all registered users (for debugging)
    getRegisteredUsers() {
        try {
            return JSON.parse(localStorage.getItem('latanda_registered_users') || '{}');
        } catch (error) {
            console.error('Error getting registered users:', error);
            return {};
        }
    }
}

// Global instance
window.apiProxy = new APIProxy();