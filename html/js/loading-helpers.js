// ============================================
// LA TANDA - LOADING STATE HELPERS
// Version: 1.0.0
// ============================================

(function() {
    "use strict";

    window.LaTandaLoading = {
        // Show loading state on a button
        buttonStart: function(button, text) {
            if (!button) return;
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.classList.add("btn-loading");
            if (text) {
                button.innerHTML = '<span class="btn-text">' + text + '</span>';
            }
        },

        // Reset button loading state
        buttonStop: function(button) {
            if (!button) return;
            button.disabled = false;
            button.classList.remove("btn-loading");
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
                delete button.dataset.originalText;
            }
        },

        // Show loading overlay on a card/container
        cardStart: function(element) {
            if (!element) return;
            element.classList.add("card-loading");
        },

        // Remove loading from card
        cardStop: function(element) {
            if (!element) return;
            element.classList.remove("card-loading");
        },

        // Show skeleton loading in a container
        showSkeleton: function(container, type) {
            if (!container) return;
            type = type || "card";

            var skeletonHtml = "";
            switch(type) {
                case "card":
                    skeletonHtml = '<div class="skeleton-card-template">' +
                        '<div class="skeleton-header">' +
                        '<div class="skeleton skeleton-avatar"></div>' +
                        '<div style="flex:1"><div class="skeleton skeleton-text medium"></div>' +
                        '<div class="skeleton skeleton-text short"></div></div></div>' +
                        '<div class="skeleton-body">' +
                        '<div class="skeleton skeleton-text full"></div>' +
                        '<div class="skeleton skeleton-text full"></div>' +
                        '<div class="skeleton skeleton-text medium"></div></div></div>';
                    break;
                case "table":
                    skeletonHtml = '<div class="skeleton-card-template">';
                    for (var i = 0; i < 5; i++) {
                        skeletonHtml += '<div class="skeleton skeleton-text full" style="margin-bottom:12px;height:40px;"></div>';
                    }
                    skeletonHtml += '</div>';
                    break;
                case "list":
                    skeletonHtml = '';
                    for (var j = 0; j < 4; j++) {
                        skeletonHtml += '<div class="skeleton-card-template" style="margin-bottom:12px;">' +
                            '<div class="skeleton-header">' +
                            '<div class="skeleton skeleton-avatar" style="width:40px;height:40px;"></div>' +
                            '<div style="flex:1"><div class="skeleton skeleton-text medium"></div>' +
                            '<div class="skeleton skeleton-text short"></div></div></div></div>';
                    }
                    break;
            }
            container.innerHTML = skeletonHtml;
        },

        // Show tab loading state
        tabStart: function(tabContent, message) {
            if (!tabContent) return;
            message = message || "Cargando...";
            tabContent.innerHTML = '<div class="tab-content-loading">' +
                '<div class="spinner"></div>' +
                '<div class="loading-message">' + message + '</div></div>';
        },

        // Show full page loading
        pageStart: function(message) {
            message = message || "Cargando...";
            var overlay = document.getElementById("latanda-loading-overlay");
            if (!overlay) {
                overlay = document.createElement("div");
                overlay.id = "latanda-loading-overlay";
                overlay.className = "loading-overlay";
                overlay.innerHTML = '<div class="spinner"></div>' +
                    '<div class="loading-text">' + message + '</div>';
                document.body.appendChild(overlay);
            } else {
                overlay.querySelector(".loading-text").textContent = message;
            }
            setTimeout(function() { overlay.classList.add("active"); }, 10);
        },

        // Hide full page loading
        pageStop: function() {
            var overlay = document.getElementById("latanda-loading-overlay");
            if (overlay) {
                overlay.classList.remove("active");
            }
        },

        // Show empty state
        showEmpty: function(container, icon, title, message, buttonText, buttonAction) {
            if (!container) return;
            icon = icon || "fas fa-inbox";
            title = title || "No hay datos";
            message = message || "";

            var html = '<div class="empty-state">' +
                '<i class="' + icon + '"></i>' +
                '<h3>' + title + '</h3>';
            if (message) {
                html += '<p>' + message + '</p>';
            }
            if (buttonText && buttonAction) {
                html += '<button class="btn btn-primary" onclick="' + buttonAction + '">' + buttonText + '</button>';
            }
            html += '</div>';
            container.innerHTML = html;
        }
    };

})();
