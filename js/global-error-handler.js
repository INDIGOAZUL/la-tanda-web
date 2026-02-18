// ============================================
// LA TANDA - GLOBAL ERROR HANDLER
// Handles 401/403, unhandled rejections, network errors
// Version: 1.0.0
// ============================================

(function() {
    "use strict";

    var AUTH_PAGE = "/main/auth-enhanced.html";
    var isRedirecting = false;

    // ============================================
    // AUTHENTICATION ERROR HANDLER
    // ============================================
    function handleAuthError(status, message) {
        if (isRedirecting) return;
        isRedirecting = true;

        console.warn("[GlobalError] Auth error detected:", status, message);

        // Clear all auth data
        if (window.LaTandaAuth && window.LaTandaAuth.clear) {
            window.LaTandaAuth.clear();
        } else {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("latanda_user");
            localStorage.removeItem("admin_token");
        }

        // Store current page for redirect after login
        var currentPath = window.location.pathname + window.location.search;
        if (currentPath.indexOf("auth") === -1) {
            localStorage.setItem("redirect_after_auth", currentPath);
        }

        // Show popup if available, then redirect
        if (window.LaTandaPopup) {
            window.LaTandaPopup.show({
                type: "warning",
                title: "Sesion Expirada",
                message: "Tu sesion ha expirado. Por favor inicia sesion nuevamente.",
                closable: false,
                buttons: [{
                    text: "Iniciar Sesion",
                    style: "primary",
                    action: function() {
                        window.location.href = AUTH_PAGE;
                    }
                }]
            });
        } else {
            alert("Tu sesion ha expirado. Seras redirigido al login.");
            window.location.href = AUTH_PAGE;
        }
    }

    // ============================================
    // NETWORK ERROR HANDLER
    // ============================================
    function handleNetworkError(error, retryFn) {
        console.error("[GlobalError] Network error:", error);

        if (window.LaTandaPopup) {
            window.LaTandaPopup.showError(
                "Error de conexion",
                "No se pudo conectar con el servidor. Verifica tu conexion a internet.",
                retryFn
            );
        } else {
            alert("Error de conexion. Por favor intenta de nuevo.");
        }
    }

    // ============================================
    // GENERIC ERROR HANDLER
    // ============================================
    function handleGenericError(error, context) {
        console.error("[GlobalError] Error in " + (context || "unknown") + ":", error);

        var message = "Ha ocurrido un error inesperado.";
        var details = "";

        if (error && error.message) {
            details = error.message;
        } else if (typeof error === "string") {
            details = error;
        }

        if (window.LaTandaPopup) {
            window.LaTandaPopup.showError(message, details);
        }
    }

    // ============================================
    // API FETCH WRAPPER
    // ============================================
    window.LaTandaFetch = async function(url, options, context) {
        options = options || {};
        context = context || "API call";

        // Add auth token if available
        if (!options.headers) {
            options.headers = {};
        }

        var token = localStorage.getItem("auth_token");
        if (token && !options.headers["Authorization"]) {
            options.headers["Authorization"] = "Bearer " + token;
        }

        if (!options.headers["Content-Type"] && options.body) {
            options.headers["Content-Type"] = "application/json";
        }

        try {
            var response = await fetch(url, options);

            // Handle auth errors
            if (response.status === 401 || response.status === 403) {
                handleAuthError(response.status, "Unauthorized access");
                return { success: false, authError: true };
            }

            // Handle not found
            if (response.status === 404) {
                console.warn("[GlobalError] Resource not found:", url);
                return {
                    success: false,
                    notFound: true,
                    error: { message: "Recurso no encontrado" }
                };
            }

            // Handle server errors
            if (response.status >= 500) {
                var errorData = null;
                try {
                    errorData = await response.json();
                } catch(e) {}

                if (window.LaTandaPopup) {
                    window.LaTandaPopup.showError(
                        "Error del servidor",
                        "El servidor encontro un problema. Intenta de nuevo en unos momentos.",
                        function() { window.LaTandaFetch(url, options, context); }
                    );
                }
                return {
                    success: false,
                    serverError: true,
                    error: errorData || { message: "Error del servidor" }
                };
            }

            // Parse JSON response
            var data = await response.json();
            return data;

        } catch (error) {
            // Network error (offline, DNS, CORS, etc.)
            if (error.name === "TypeError" && error.message.indexOf("fetch") !== -1) {
                handleNetworkError(error, function() {
                    window.LaTandaFetch(url, options, context);
                });
            } else {
                handleGenericError(error, context);
            }
            return { success: false, networkError: true, error: error };
        }
    };

    // ============================================
    // GLOBAL UNHANDLED REJECTION HANDLER
    // ============================================
    window.addEventListener("unhandledrejection", function(event) {
        var reason = event.reason;

        console.error("[GlobalError] Unhandled Promise rejection:", reason);

        // Check if it's an auth error from fetch
        if (reason && (reason.status === 401 || reason.status === 403)) {
            event.preventDefault();
            handleAuthError(reason.status, "Session expired");
            return;
        }

        // Ignore ServiceWorker registration errors (not critical)
        if (reason && reason.message && reason.message.indexOf("ServiceWorker") !== -1) {
            event.preventDefault();
            return;
        }

        // Check for network errors
        if (reason && reason.name === "TypeError") {
            event.preventDefault();
            handleNetworkError(reason);
            return;
        }

        // Log but don't show popup for all unhandled rejections
        // (too noisy for users)
    });

    // ============================================
    // GLOBAL ERROR HANDLER
    // ============================================
    window.addEventListener("error", function(event) {
        console.error("[GlobalError] Uncaught error:", event.error || event.message);

        // Don't show popup for script loading errors
        if (event.filename && event.filename.indexOf(".js") !== -1) {
            return;
        }
    });

    // ============================================
    // SAFE TAB SWITCH WRAPPER
    // ============================================
    window.LaTandaSafeTabSwitch = function(tabName, loadFunction, tabContainer) {
        return new Promise(function(resolve, reject) {
            // Show loading state
            if (window.LaTandaPopup) {
                window.LaTandaPopup.showLoading("Cargando " + tabName + "...");
            }

            // Update tab UI
            if (tabContainer) {
                var tabs = tabContainer.querySelectorAll(".nav-tab, .tab-btn");
                tabs.forEach(function(tab) {
                    tab.classList.remove("active");
                    if (tab.dataset.tab === tabName || tab.textContent.toLowerCase().indexOf(tabName) !== -1) {
                        tab.classList.add("active");
                    }
                });
            }

            // Execute load function with error handling
            Promise.resolve()
                .then(function() {
                    if (typeof loadFunction === "function") {
                        return loadFunction();
                    }
                })
                .then(function(result) {
                    if (window.LaTandaPopup) {
                        window.LaTandaPopup.hideLoading();
                    }
                    resolve(result);
                })
                .catch(function(error) {
                    if (window.LaTandaPopup) {
                        window.LaTandaPopup.hideLoading();
                        window.LaTandaPopup.showError(
                            "Error al cargar " + tabName,
                            error.message || "No se pudo cargar el contenido",
                            function() {
                                window.LaTandaSafeTabSwitch(tabName, loadFunction, tabContainer);
                            }
                        );
                    }
                    reject(error);
                });
        });
    };

    // ============================================
    // URL PARAMETER VALIDATOR
    // ============================================
    window.LaTandaValidateURLParams = function(params) {
        var errors = [];

        // Validate group ID format
        if (params.group) {
            if (!/^[a-zA-Z0-9_-]+$/.test(params.group)) {
                errors.push({ param: "group", message: "ID de grupo invalido" });
            }
        }

        // Validate tanda ID format
        if (params.tanda) {
            if (!/^[a-zA-Z0-9_-]+$/.test(params.tanda)) {
                errors.push({ param: "tanda", message: "ID de tanda invalido" });
            }
        }

        // Validate tab names
        var validTabs = ["overview", "transactions", "groups", "tandas", "create", "analytics", "matching", "settings"];
        if (params.tab && validTabs.indexOf(params.tab) === -1) {
            errors.push({ param: "tab", message: "Pestana no reconocida: " + params.tab });
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    };

    // ============================================
    // SAFE URL PARAMETER HANDLER
    // ============================================
    window.LaTandaHandleURLParams = async function(handlers) {
        var urlParams = new URLSearchParams(window.location.search);
        var params = {
            group: urlParams.get("group"),
            tanda: urlParams.get("tanda"),
            tab: urlParams.get("tab"),
            id: urlParams.get("id")
        };

        // Validate parameters
        var validation = window.LaTandaValidateURLParams(params);
        if (!validation.valid) {
            console.warn("[GlobalError] Invalid URL params:", validation.errors);
            if (window.LaTandaPopup) {
                window.LaTandaPopup.showWarning(
                    "Enlace invalido: " + validation.errors[0].message
                );
            }
            return false;
        }

        // Handle group deep link
        if (params.group && handlers.onGroup) {
            try {
                await handlers.onGroup(params.group);
            } catch (error) {
                if (window.LaTandaPopup) {
                    window.LaTandaPopup.showError(
                        "Grupo no encontrado",
                        "El grupo solicitado no existe o no tienes acceso."
                    );
                }
                return false;
            }
        }

        // Handle tanda deep link
        if (params.tanda && handlers.onTanda) {
            try {
                await handlers.onTanda(params.tanda);
            } catch (error) {
                if (window.LaTandaPopup) {
                    window.LaTandaPopup.showError(
                        "Tanda no encontrada",
                        "La tanda solicitada no existe o no tienes acceso."
                    );
                }
                return false;
            }
        }

        // Handle tab switch
        if (params.tab && handlers.onTab) {
            try {
                await handlers.onTab(params.tab);
            } catch (error) {
                console.warn("[GlobalError] Tab switch failed:", error);
            }
        }

        return true;
    };

    // ============================================
    // PERIODIC AUTH CHECK
    // ============================================
    function checkAuthPeriodically() {
        var token = localStorage.getItem("auth_token");
        if (!token) return;

        try {
            var parts = token.split(".");
            if (parts.length !== 3) return;

            var payload = JSON.parse(atob(parts[1]));
            var now = Math.floor(Date.now() / 1000);

            // Token expires in less than 5 minutes
            if (payload.exp && (payload.exp - now) < 300) {
                console.warn("[GlobalError] Token expiring soon");

                if (window.LaTandaPopup) {
                    window.LaTandaPopup.showWarning(
                        "Tu sesion expirara pronto. Guarda tu trabajo.",
                        [{
                            text: "Renovar Sesion",
                            style: "primary",
                            action: function() {
                                window.location.href = AUTH_PAGE;
                            }
                        }, {
                            text: "Continuar",
                            style: "secondary"
                        }]
                    );
                }
            }

            // Token already expired
            if (payload.exp && payload.exp < now) {
                handleAuthError(401, "Token expired");
            }
        } catch (e) {
            console.error("[GlobalError] Error checking token:", e);
        }
    }

    // Check auth every 5 minutes
    setInterval(checkAuthPeriodically, 5 * 60 * 1000);

    // Also check on visibility change (user returns to tab)
    document.addEventListener("visibilitychange", function() {
        if (document.visibilityState === "visible") {
            checkAuthPeriodically();
        }
    });

})();
