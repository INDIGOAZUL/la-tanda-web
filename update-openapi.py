#!/usr/bin/env python3
"""
Update OpenAPI spec from v4.7.0 to v4.11.3
Adds missing endpoints discovered in integrated-api-complete-95-endpoints.js
"""

import json
import re
from datetime import datetime

# Load existing OpenAPI spec
with open('docs/swagger/openapi.json', 'r') as f:
    openapi = json.load(f)

# Update version
openapi['info']['version'] = '4.11.3'
openapi['info']['description'] = f'La Tanda API - Updated {datetime.now().strftime("%Y-%m-%d")} (v4.11.3)'

paths = openapi.setdefault('paths', {})

# Define missing endpoints with their OpenAPI definitions
# Based on analysis of integrated-api-complete-95-endpoints.js
missing_endpoints = {
    # Feed/Social endpoints
    '/api/feed/social/track-views': {
        'post': {
            'tags': ['Feed', 'Social'],
            'summary': 'Batch increment view counts for social feed events',
            'description': 'Track views for multiple social feed events in a single request',
            'requestBody': {
                'required': True,
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'required': ['event_ids'],
                            'properties': {
                                'event_ids': {
                                    'type': 'array',
                                    'items': {'type': 'string', 'format': 'uuid'},
                                    'description': 'Array of event IDs to track (max 50)',
                                    'maxItems': 50
                                }
                            }
                        }
                    }
                }
            },
            'responses': {
                '200': {
                    'description': 'Views tracked successfully',
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'object',
                                'properties': {
                                    'success': {'type': 'boolean'},
                                    'tracked': {'type': 'integer', 'description': 'Number of events updated'}
                                }
                            }
                        }
                    }
                },
                '400': {'description': 'Invalid request'},
                '500': {'description': 'Server error'}
            }
        }
    },
    
    # Admin endpoints
    '/api/admin/dashboard/stats': {
        'get': {
            'tags': ['Admin'],
            'summary': 'Get admin dashboard statistics',
            'security': [{'bearerAuth': []}],
            'responses': {
                '200': {
                    'description': 'Dashboard stats',
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'object',
                                'properties': {
                                    'totalUsers': {'type': 'integer'},
                                    'activeGroups': {'type': 'integer'},
                                    'totalVolume': {'type': 'number'},
                                    'pendingActions': {'type': 'integer'}
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    
    '/api/admin/users': {
        'get': {
            'tags': ['Admin'],
            'summary': 'List all users (admin)',
            'security': [{'bearerAuth': []}],
            'parameters': [
                {'name': 'limit', 'in': 'query', 'schema': {'type': 'integer', 'default': 20}},
                {'name': 'offset', 'in': 'query', 'schema': {'type': 'integer', 'default': 0}},
                {'name': 'status', 'in': 'query', 'schema': {'type': 'string', 'enum': ['active', 'suspended', 'pending']}}
            ],
            'responses': {
                '200': {'description': 'List of users'}
            }
        }
    },
    
    '/api/admin/contributions/pending': {
        'get': {
            'tags': ['Admin'],
            'summary': 'Get pending contributions awaiting verification',
            'security': [{'bearerAuth': []}],
            'responses': {
                '200': {'description': 'List of pending contributions'}
            }
        }
    },
    
    '/api/admin/payouts/pending': {
        'get': {
            'tags': ['Admin'],
            'summary': 'Get pending payouts',
            'security': [{'bearerAuth': []}],
            'responses': {
                '200': {'description': 'List of pending payouts'}
            }
        }
    },
    
    '/api/admin/withdrawals/pending': {
        'get': {
            'tags': ['Admin'],
            'summary': 'Get pending withdrawals',
            'security': [{'bearerAuth': []}],
            'responses': {
                '200': {'description': 'List of pending withdrawals'}
            }
        }
    },
    
    # Auth endpoints
    '/api/auth/merge-accounts': {
        'post': {
            'tags': ['Auth'],
            'summary': 'Merge duplicate user accounts',
            'requestBody': {
                'required': True,
                'content': {
                    'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'primaryEmail': {'type': 'string', 'format': 'email'},
                                'secondaryEmail': {'type': 'string', 'format': 'email'}
                            }
                        }
                    }
                }
            },
            'responses': {
                '200': {'description': 'Accounts merged successfully'}
            }
        }
    },
    
    # Dashboard endpoints
    '/api/dashboard/summary': {
        'get': {
            'tags': ['Dashboard'],
            'summary': 'Get user dashboard summary',
            'security': [{'bearerAuth': []}],
            'responses': {
                '200': {
                    'description': 'Dashboard summary with groups, tandas, and wallet info',
                    'content': {
                        'application/json': {
                            'schema': {
                                'type': 'object',
                                'properties': {
                                    'groups': {'type': 'integer'},
                                    'activeTandas': {'type': 'integer'},
                                    'walletBalance': {'type': 'number'},
                                    'pendingContributions': {'type': 'integer'}
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    
    # Analytics endpoints
    '/api/analytics/': {
        'get': {
            'tags': ['Analytics'],
            'summary': 'Get analytics data',
            'security': [{'bearerAuth': []}],
            'responses': {
                '200': {'description': 'Analytics data'}
            }
        }
    },
    
    # Cron endpoints
    '/api/cron/check-payment-status': {
        'get': {
            'tags': ['Cron', 'Internal'],
            'summary': 'Check payment status (scheduled task)',
            'security': [{'apiKey': []}],
            'responses': {
                '200': {'description': 'Payment status check completed'}
            }
        }
    },
    
    '/api/cron/execute-scheduled-lotteries': {
        'get': {
            'tags': ['Cron', 'Lottery'],
            'summary': 'Execute scheduled lottery draws',
            'security': [{'apiKey': []}],
            'responses': {
                '200': {'description': 'Lottery execution completed'}
            }
        }
    },
    
    '/api/cron/send-recruitment-reminders': {
        'get': {
            'tags': ['Cron'],
            'summary': 'Send recruitment reminders',
            'security': [{'apiKey': []}],
            'responses': {
                '200': {'description': 'Reminders sent'}
            }
        }
    },
}

# Add missing endpoints
added = 0
for path, definition in missing_endpoints.items():
    if path not in paths:
        paths[path] = definition
        added += 1
        print(f'Added: {path}')

print(f'\nTotal endpoints added: {added}')
print(f'Total paths now: {len(paths)}')

# Update info
openapi['info']['version'] = '4.11.3'
openapi['info']['description'] = f'La Tanda Platform API v4.11.3 - {datetime.now().strftime("%Y-%m-%d")}'

# Save updated spec
with open('docs/swagger/openapi.json', 'w') as f:
    json.dump(openapi, f, indent=2)

print(f'\n✅ OpenAPI spec updated to v4.11.3')
print(f'Saved to: docs/swagger/openapi.json')
