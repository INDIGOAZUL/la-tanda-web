/**
 * ErrorHandler - Context-specific error messages with recovery actions
 * Part of User Readiness Week 1, Day 4 Implementation
 */
class ErrorHandler {
  constructor() {
    this.errorCategories = {
      NETWORK: 'network',
      AUTH: 'auth',
      VALIDATION: 'validation',
      NOT_FOUND: 'not_found',
      PERMISSION: 'permission',
      SERVER: 'server',
      QUOTA: 'quota',
      UNKNOWN: 'unknown'
    };

    this.init();
  }

  init() {
    console.log('✅ ErrorHandler initialized');
  }

  /**
   * Categorize error based on error object
   * @param {Error|Object} error - Error object or API response
   * @returns {string} Error category
   */
  categorize(error) {
    // Network errors
    if (error.message?.includes('Failed to fetch') ||
        error.message?.includes('Network request failed') ||
        error.name === 'NetworkError' ||
        !navigator.onLine) {
      return this.errorCategories.NETWORK;
    }

    // Auth errors
    if (error.status === 401 ||
        error.code === 'UNAUTHORIZED' ||
        error.message?.includes('unauthorized') ||
        error.message?.includes('session expired')) {
      return this.errorCategories.AUTH;
    }

    // Validation errors
    if (error.status === 400 ||
        error.code === 'VALIDATION_ERROR' ||
        error.message?.includes('validation') ||
        error.message?.includes('invalid')) {
      return this.errorCategories.VALIDATION;
    }

    // Not found errors
    if (error.status === 404 ||
        error.code === 'NOT_FOUND' ||
        error.message?.includes('not found')) {
      return this.errorCategories.NOT_FOUND;
    }

    // Permission errors
    if (error.status === 403 ||
        error.code === 'FORBIDDEN' ||
        error.message?.includes('permission') ||
        error.message?.includes('forbidden')) {
      return this.errorCategories.PERMISSION;
    }

    // Quota/limit errors
    if (error.status === 429 ||
        error.code === 'QUOTA_EXCEEDED' ||
        error.message?.includes('quota') ||
        error.message?.includes('limit exceeded')) {
      return this.errorCategories.QUOTA;
    }

    // Server errors
    if (error.status >= 500 ||
        error.code === 'SERVER_ERROR' ||
        error.message?.includes('server error')) {
      return this.errorCategories.SERVER;
    }

    return this.errorCategories.UNKNOWN;
  }

  /**
   * Get context-specific error message and recovery action
   * @param {Error|Object} error - Error object
   * @param {string} context - Operation context (e.g., 'load_groups', 'create_group')
   * @returns {Object} { message, action, duration }
   */
  getContextualError(error, context) {
    const category = this.categorize(error);
    const contextKey = `${context}_${category}`;

    // Context-specific error messages with recovery actions
    const errorMessages = {
      // Load Groups errors
      'load_groups_network': {
        message: 'No se pueden cargar los grupos. Por favor verifica tu conexión a internet.',
        action: {
          text: 'Reintentar',
          onClick: () => window.advancedGroupsSystem?.loadGroupsContent(true)
        },
        duration: 8000
      },
      'load_groups_auth': {
        message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
        action: {
          text: 'Iniciar Sesión',
          onClick: () => window.location.href = '/auth.html'
        },
        duration: 10000
      },
      'load_groups_server': {
        message: 'Error del servidor al cargar grupos. Nuestro equipo ha sido notificado.',
        action: {
          text: 'Reintentar',
          onClick: () => window.advancedGroupsSystem?.loadGroupsContent(true)
        },
        duration: 8000
      },
      'load_groups_unknown': {
        message: 'Error al cargar grupos. Por favor intenta de nuevo.',
        action: {
          text: 'Reintentar',
          onClick: () => window.advancedGroupsSystem?.loadGroupsContent(true)
        },
        duration: 6000
      },

      // Create Group errors
      'create_group_network': {
        message: 'No se pudo crear el grupo. Verifica tu conexión a internet.',
        action: {
          text: 'Reintentar',
          onClick: () => {
            const form = document.getElementById('createGroupForm');
            if (form) {
              const event = new Event('submit', { bubbles: true, cancelable: true });
              form.dispatchEvent(event);
            }
          }
        },
        duration: 8000
      },
      'create_group_validation': {
        message: error.message || 'Datos del grupo inválidos. Por favor revisa el formulario.',
        action: null,
        duration: 6000
      },
      'create_group_quota': {
        message: 'Has alcanzado el límite de grupos. Actualiza tu plan para crear más grupos.',
        action: {
          text: 'Ver Planes',
          onClick: () => window.location.href = '/pricing.html'
        },
        duration: 10000
      },
      'create_group_auth': {
        message: 'Tu sesión ha expirado. Por favor inicia sesión e intenta de nuevo.',
        action: {
          text: 'Iniciar Sesión',
          onClick: () => window.location.href = '/auth.html'
        },
        duration: 10000
      },
      'create_group_server': {
        message: 'Error del servidor al crear grupo. Por favor intenta más tarde.',
        action: {
          text: 'Reintentar',
          onClick: () => {
            const form = document.getElementById('createGroupForm');
            if (form) {
              const event = new Event('submit', { bubbles: true, cancelable: true });
              form.dispatchEvent(event);
            }
          }
        },
        duration: 8000
      },
      'create_group_unknown': {
        message: 'Error al crear grupo: ' + (error.message || 'Error desconocido'),
        action: null,
        duration: 6000
      },

      // API Request errors
      'api_request_network': {
        message: 'Sin conexión. Verifica tu conexión a internet e intenta de nuevo.',
        action: null,
        duration: 6000
      },
      'api_request_auth': {
        message: 'Sesión expirada. Por favor inicia sesión nuevamente.',
        action: {
          text: 'Iniciar Sesión',
          onClick: () => window.location.href = '/auth.html'
        },
        duration: 10000
      },
      'api_request_server': {
        message: 'El servidor no responde. Por favor intenta más tarde.',
        action: null,
        duration: 6000
      },

      // Update Group errors
      'update_group_permission': {
        message: 'No tienes permiso para modificar este grupo.',
        action: null,
        duration: 6000
      },
      'update_group_not_found': {
        message: 'Grupo no encontrado. Puede haber sido eliminado.',
        action: {
          text: 'Actualizar Lista',
          onClick: () => window.advancedGroupsSystem?.loadGroupsContent(true)
        },
        duration: 8000
      }
    };

    // Return context-specific error or generic fallback
    return errorMessages[contextKey] || {
      message: error.message || 'Ha ocurrido un error. Por favor intenta de nuevo.',
      action: null,
      duration: 5000
    };
  }

  /**
   * Handle error with context-specific message and action
   * @param {Error|Object} error - Error object
   * @param {string} context - Operation context
   */
  handle(error, context) {
    const { message, action, duration } = this.getContextualError(error, context);

    // Show error with toast system
    if (window.showError) {
      window.showError(message, duration, { action });
    } else {
      console.error(`[${context}]`, message, error);
      alert(message);
    }

    // Log to console for debugging
    console.error(`❌ Error [${context}]:`, {
      category: this.categorize(error),
      originalError: error,
      message: message
    });
  }

  /**
   * Check if user is online
   * @returns {boolean}
   */
  isOnline() {
    return navigator.onLine;
  }

  /**
   * Wrap async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {string} context - Operation context
   * @returns {Function} Wrapped function
   */
  wrap(fn, context) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handle(error, context);
        throw error;
      }
    };
  }
}

// Initialize global instance
window.errorHandler = new ErrorHandler();

console.log('✅ ErrorHandler loaded and available globally');
