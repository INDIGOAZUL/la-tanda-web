/**
 * URL Parameter Handler for La Tanda
 * Handles deep linking from search results with validation and error handling
 * Version: 2.0.0
 */

(function() {
    "use strict";

    async function handleURLParams() {
        var urlParams = new URLSearchParams(window.location.search);
        var groupId = urlParams.get("group");
        var tandaId = urlParams.get("tanda");
        var transactionId = urlParams.get("id");
        var tab = urlParams.get("tab");


        // Use safe handler if available
        if (window.LaTandaHandleURLParams) {
            var handled = await window.LaTandaHandleURLParams({
                onGroup: function(id) {
                    return new Promise(function(resolve, reject) {
                        if (typeof viewGroup === "function") {
                            try {
                                viewGroup(id);
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        } else {
                            reject(new Error("viewGroup function not available"));
                        }
                    });
                },
                onTanda: function(id) {
                    return new Promise(function(resolve, reject) {
                        if (typeof viewGroup === "function") {
                            try {
                                // Try to find the group that contains this tanda
                                if (typeof window.allGroups !== "undefined") {
                                    var group = window.allGroups.find(function(g) {
                                        return g.tanda_id === id ||
                                            (g.tandas && g.tandas.some(function(t) { return t.id === id; }));
                                    });
                                    if (group) {
                                        viewGroup(group.id || group.group_id);
                                    } else {
                                        viewGroup(id);
                                    }
                                } else {
                                    viewGroup(id);
                                }
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        } else {
                            reject(new Error("viewGroup function not available"));
                        }
                    });
                },
                onTab: function(tabName) {
                    return new Promise(function(resolve, reject) {
                        if (typeof switchTab === "function") {
                            try {
                                switchTab(tabName);

                                // Highlight specific transaction if ID provided
                                if (transactionId) {
                                    setTimeout(function() {
                                        var txElement = document.querySelector("[data-transaction-id=\"" + transactionId + "\"]");
                                        if (txElement) {
                                            txElement.scrollIntoView({ behavior: "smooth", block: "center" });
                                            txElement.classList.add("highlighted");
                                            setTimeout(function() {
                                                txElement.classList.remove("highlighted");
                                            }, 3000);
                                        }
                                    }, 300);
                                }
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        } else {
                            // Tab function not available yet, might load later
                            resolve();
                        }
                    });
                }
            });
            return handled;
        }

        // Fallback to original behavior if safe handler not loaded
        if (groupId && typeof viewGroup === "function") {
            try {
                viewGroup(groupId);
            } catch (e) {
                console.error("[URLParams] Error opening group:", e);
                if (window.LaTandaPopup) {
                    window.LaTandaPopup.showError("Error al abrir grupo", e.message);
                }
            }
            return;
        }

        if (tandaId && typeof viewGroup === "function") {
            try {
                if (typeof window.allGroups !== "undefined") {
                    var group = window.allGroups.find(function(g) {
                        return g.tanda_id === tandaId ||
                            (g.tandas && g.tandas.some(function(t) { return t.id === tandaId; }));
                    });
                    if (group) {
                        viewGroup(group.id || group.group_id);
                    } else {
                        viewGroup(tandaId);
                    }
                } else {
                    viewGroup(tandaId);
                }
            } catch (e) {
                console.error("[URLParams] Error opening tanda:", e);
                if (window.LaTandaPopup) {
                    window.LaTandaPopup.showError("Error al abrir tanda", e.message);
                }
            }
            return;
        }

        if (tab && typeof switchTab === "function") {
            try {
                switchTab(tab);
                if (transactionId) {
                    setTimeout(function() {
                        var txElement = document.querySelector("[data-transaction-id=\"" + transactionId + "\"]");
                        if (txElement) {
                            txElement.scrollIntoView({ behavior: "smooth", block: "center" });
                            txElement.classList.add("highlighted");
                            setTimeout(function() {
                                txElement.classList.remove("highlighted");
                            }, 3000);
                        }
                    }, 300);
                }
            } catch (e) {
                console.error("[URLParams] Error switching tab:", e);
            }
        }
    }

    // Run after DOM is ready and components are loaded
    function initURLHandler() {
        // Wait for components to be ready
        var checkReady = function() {
            // Check if page-specific functions are loaded
            var hasViewGroup = typeof viewGroup === "function";
            var hasSwitchTab = typeof switchTab === "function";
            var hasGlobalHandler = typeof window.LaTandaHandleURLParams === "function";

            if (hasViewGroup || hasSwitchTab || hasGlobalHandler) {
                handleURLParams();
            } else {
                // Retry after 500ms
                setTimeout(checkReady, 500);
            }
        };

        // Start checking after initial delay
        setTimeout(checkReady, 1000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initURLHandler);
    } else {
        initURLHandler();
    }

    // Expose globally
    window.handleURLParams = handleURLParams;
})();
