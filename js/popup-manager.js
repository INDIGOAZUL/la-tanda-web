/**
 * La Tanda Unified Popup Manager
 * Replaces all existing notification systems with a consistent UI
 * Version: 1.0.0
 * Date: 2025-12-23
 */

class LaTandaPopupManager {
    constructor() {
        this.queue = [];
        this.activePopup = null;
        this.zIndex = 10000;
        this.injectStyles();
    }

    static instance = null;
    static getInstance() {
        if (!LaTandaPopupManager.instance) {
            LaTandaPopupManager.instance = new LaTandaPopupManager();
        }
        return LaTandaPopupManager.instance;
    }

    injectStyles() {
        if (!document.getElementById("latanda-popup-styles")) {
            const link = document.createElement("link");
            link.id = "latanda-popup-styles";
            link.rel = "stylesheet";
            link.href = "/css/popup-manager.css?v=7.98";
            document.head.appendChild(link);
        }
    }

    show(options) {
        const defaults = {
            type: "info",
            title: "",
            message: "",
            details: "",
            icon: null,
            buttons: [],
            closable: true,
            autoClose: 0,
            position: "center",
            animation: "fadeIn",
            onClose: null,
            fields: [],
            steps: [],
            currentStep: 0
        };

        const config = { ...defaults, ...options };
        if (!config.icon) {
            config.icon = this.getDefaultIcon(config.type);
        }

        const popup = this.createPopupElement(config);
        document.body.appendChild(popup);

        requestAnimationFrame(() => {
            popup.classList.add("visible");
        });

        this.activePopup = popup;

        if (config.autoClose > 0) {
            setTimeout(() => this.close(popup), config.autoClose);
        }

        return popup;
    }

    createPopupElement(config) {
        const overlay = document.createElement("div");
        overlay.className = "latanda-popup-overlay " + config.position + " " + config.animation;
        overlay.style.zIndex = this.zIndex++;

        if (config.closable) {
            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) this.close(overlay);
            });
        }

        const popup = document.createElement("div");
        popup.className = "latanda-popup latanda-popup-" + config.type;

        // Header
        const header = document.createElement("div");
        header.className = "latanda-popup-header";

        const iconSpan = document.createElement("span");
        iconSpan.className = "latanda-popup-icon";
        iconSpan.innerHTML = config.icon;

        const titleSpan = document.createElement("span");
        titleSpan.className = "latanda-popup-title";
        titleSpan.textContent = config.title || this.getDefaultTitle(config.type);

        header.appendChild(iconSpan);
        header.appendChild(titleSpan);

        if (config.closable) {
            const closeBtn = document.createElement("button");
            closeBtn.className = "latanda-popup-close";
            closeBtn.innerHTML = "&times;";
            closeBtn.onclick = () => this.close(overlay);
            header.appendChild(closeBtn);
        }

        popup.appendChild(header);

        // Body
        const body = document.createElement("div");
        body.className = "latanda-popup-body";

        if (config.type === "form" && config.fields.length > 0) {
            body.appendChild(this.createFormFields(config.fields));
        } else if (config.type === "guide" && config.steps.length > 0) {
            body.appendChild(this.createGuideContent(config));
        } else {
            if (config.message) {
                const msgP = document.createElement("p");
                msgP.className = "latanda-popup-message";
                msgP.textContent = config.message;
                body.appendChild(msgP);
            }
            if (config.details) {
                const detailsP = document.createElement("p");
                detailsP.className = "latanda-popup-details";
                detailsP.textContent = config.details;
                body.appendChild(detailsP);
            }
        }

        popup.appendChild(body);

        // Footer
        if (config.buttons.length > 0) {
            const footer = document.createElement("div");
            footer.className = "latanda-popup-footer";

            config.buttons.forEach(btn => {
                const button = document.createElement("button");
                button.className = "latanda-popup-btn latanda-popup-btn-" + (btn.style || "default");
                button.textContent = btn.text;
                button.onclick = () => {
                    if (btn.action) btn.action(overlay);
                    if (btn.close !== false) this.close(overlay);
                };
                footer.appendChild(button);
            });

            popup.appendChild(footer);
        }

        overlay.appendChild(popup);
        return overlay;
    }

    createFormFields(fields) {
        const form = document.createElement("div");
        form.className = "latanda-popup-form";

        fields.forEach(field => {
            const group = document.createElement("div");
            group.className = "latanda-popup-field";

            const label = document.createElement("label");
            label.textContent = field.label;
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "textarea") {
                input = document.createElement("textarea");
            } else if (field.type === "select") {
                input = document.createElement("select");
                field.options.forEach(opt => {
                    const option = document.createElement("option");
                    option.value = opt.value;
                    option.textContent = opt.label;
                    input.appendChild(option);
                });
            } else {
                input = document.createElement("input");
                input.type = field.type || "text";
            }

            input.id = field.name;
            input.name = field.name;
            input.placeholder = field.placeholder || "";
            if (field.required) input.required = true;
            if (field.value) input.value = field.value;

            group.appendChild(label);
            group.appendChild(input);
            form.appendChild(group);
        });

        return form;
    }

    createGuideContent(config) {
        const guide = document.createElement("div");
        guide.className = "latanda-popup-guide";

        const progress = document.createElement("div");
        progress.className = "latanda-popup-progress";
        const progressBar = document.createElement("div");
        progressBar.className = "latanda-popup-progress-bar";
        progressBar.style.width = ((config.currentStep + 1) / config.steps.length * 100) + "%";
        progress.appendChild(progressBar);
        guide.appendChild(progress);

        const stepInfo = document.createElement("div");
        stepInfo.className = "latanda-popup-step-info";
        stepInfo.textContent = "Paso " + (config.currentStep + 1) + " de " + config.steps.length;
        guide.appendChild(stepInfo);

        const stepContent = document.createElement("div");
        stepContent.className = "latanda-popup-step-content";
        stepContent.textContent = config.steps[config.currentStep].content;
        guide.appendChild(stepContent);

        return guide;
    }

    close(popup) {
        if (!popup) popup = this.activePopup;
        if (!popup) return;

        popup.classList.remove("visible");
        popup.classList.add("closing");

        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
            if (this.activePopup === popup) {
                this.activePopup = null;
            }
        }, 300);
    }

    closeAll() {
        document.querySelectorAll(".latanda-popup-overlay").forEach(popup => {
            this.close(popup);
        });
    }

    // Convenience methods
    showError(message, details, retryFn) {
        const buttons = [];
        if (retryFn) {
            buttons.push({ text: "Reintentar", action: retryFn, style: "primary" });
        }
        buttons.push({ text: "Cerrar", style: "secondary" });

        return this.show({
            type: "error",
            title: "Error",
            message: message,
            details: details || "",
            buttons: buttons,
            animation: "shake"
        });
    }

    showSuccess(message, duration) {
        return this.show({
            type: "success",
            title: "Exito",
            message: message,
            autoClose: duration || 3000,
            buttons: [{ text: "Aceptar", style: "primary" }]
        });
    }

    showWarning(message, actions) {
        const buttons = (actions && actions.length > 0) ? actions : [
            { text: "Entendido", style: "primary" }
        ];

        return this.show({
            type: "warning",
            title: "Advertencia",
            message: message,
            buttons: buttons
        });
    }

    showInfo(message) {
        return this.show({
            type: "info",
            title: "Informacion",
            message: message,
            autoClose: 4000,
            buttons: [{ text: "OK", style: "primary" }]
        });
    }

    showConfirm(message, onConfirm, onCancel) {
        return this.show({
            type: "confirm",
            title: "Confirmar",
            message: message,
            closable: false,
            buttons: [
                { text: "Confirmar", style: "primary", action: function() { if(onConfirm) onConfirm(); } },
                { text: "Cancelar", style: "secondary", action: function() { if(onCancel) onCancel(); } }
            ]
        });
    }

    showForm(title, fields, onSubmit) {
        var self = this;
        return this.show({
            type: "form",
            title: title,
            fields: fields,
            buttons: [
                {
                    text: "Guardar",
                    style: "primary",
                    close: false,
                    action: function(popup) {
                        var formData = {};
                        fields.forEach(function(f) {
                            var input = popup.querySelector("#" + f.name);
                            if (input) formData[f.name] = input.value;
                        });
                        if (onSubmit(formData)) {
                            self.close(popup);
                        }
                    }
                },
                { text: "Cancelar", style: "secondary" }
            ]
        });
    }

    showGuide(steps, onComplete) {
        var self = this;
        var currentStep = 0;

        var showStep = function(stepIndex) {
            self.closeAll();

            var isLast = stepIndex === steps.length - 1;
            var isFirst = stepIndex === 0;

            var buttons = [];
            if (!isFirst) {
                buttons.push({
                    text: "Anterior",
                    style: "secondary",
                    action: function() { showStep(stepIndex - 1); }
                });
            }
            if (isLast) {
                buttons.push({
                    text: "Finalizar",
                    style: "primary",
                    action: function() { if(onComplete) onComplete(); }
                });
            } else {
                buttons.push({
                    text: "Siguiente",
                    style: "primary",
                    action: function() { showStep(stepIndex + 1); }
                });
            }

            return self.show({
                type: "guide",
                title: steps[stepIndex].title || "Guia",
                steps: steps,
                currentStep: stepIndex,
                closable: true,
                buttons: buttons
            });
        };

        return showStep(0);
    }

    showLoading(message) {
        var overlay = document.createElement("div");
        overlay.id = "latanda-loading-overlay";
        overlay.className = "latanda-popup-overlay center visible";
        overlay.style.zIndex = this.zIndex++;
        overlay.innerHTML = '<div class="latanda-popup latanda-popup-loading"><div class="latanda-loading-spinner"></div><p>' + (message || "Cargando...") + '</p></div>';
        document.body.appendChild(overlay);
        return overlay;
    }

    hideLoading() {
        var overlay = document.getElementById("latanda-loading-overlay");
        if (overlay) {
            this.close(overlay);
        }
    }

    // Duplicate account methods
    showDuplicateAccounts(accounts, onSelect, onDelete, onSkip) {
        var self = this;
        var accountsHtml = accounts.map(function(acc) {
            return '<div class="latanda-duplicate-account" data-id="' + acc.id + '">' +
                '<div class="latanda-duplicate-info">' +
                '<span class="latanda-duplicate-email">' + acc.email + '</span>' +
                '<span class="latanda-duplicate-date">Creada: ' + new Date(acc.created_at).toLocaleDateString("es-HN") + '</span>' +
                '<span class="latanda-duplicate-status">' + (acc.email_verified ? "Verificada" : "No verificada") + '</span>' +
                '</div>' +
                '<div class="latanda-duplicate-actions">' +
                '<button class="latanda-popup-btn latanda-popup-btn-primary btn-use" data-id="' + acc.id + '">Usar Esta</button>' +
                '<button class="latanda-popup-btn latanda-popup-btn-danger btn-delete" data-id="' + acc.id + '">Eliminar</button>' +
                '</div></div>';
        }).join("");

        var popup = this.show({
            type: "warning",
            title: "Cuentas Duplicadas Detectadas",
            message: '<p>Encontramos multiples cuentas con tu informacion:</p><div class="latanda-duplicate-list">' + accountsHtml + '</div>',
            closable: false,
            buttons: [
                { text: "Continuar sin cambios", style: "secondary", action: function() { if(onSkip) onSkip(); } }
            ]
        });

        popup.querySelectorAll(".btn-use").forEach(function(btn) {
            btn.onclick = function() {
                var accountId = btn.dataset.id;
                self.close(popup);
                if(onSelect) onSelect(accountId);
            };
        });

        popup.querySelectorAll(".btn-delete").forEach(function(btn) {
            btn.onclick = function() {
                var accountId = btn.dataset.id;
                var account = accounts.find(function(a) { return a.id === accountId; });
                self.showDeleteAccountConfirm(account, function() {
                    if(onDelete) onDelete(accountId);
                });
            };
        });

        return popup;
    }

    showDeleteAccountConfirm(account, onConfirm) {
        var self = this;
        return this.show({
            type: "warning",
            title: "Datos de la Cuenta",
            message: '<p>Esta cuenta tiene:</p>' +
                '<ul class="latanda-account-data">' +
                '<li>Saldo: L. ' + (account.balance || "0.00") + '</li>' +
                '<li>Contribuciones: ' + (account.contributions || 0) + '</li>' +
                '<li>Grupos: ' + (account.groups || 0) + '</li>' +
                '</ul><p>Que deseas hacer con estos datos?</p>',
            closable: true,
            buttons: [
                {
                    text: "Transferir a otra cuenta",
                    style: "primary",
                    action: function() {
                        self.showInfo("Funcion de transferencia proximamente disponible");
                    }
                },
                {
                    text: "Eliminar todo",
                    style: "danger",
                    action: function() { if(onConfirm) onConfirm(); }
                },
                { text: "Cancelar", style: "secondary" }
            ]
        });
    }

    getDefaultIcon(type) {
        var icons = {
            error: '<i class="fas fa-times-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            success: '<i class="fas fa-check-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>',
            confirm: '<i class="fas fa-question-circle"></i>',
            form: '<i class="fas fa-edit"></i>',
            guide: '<i class="fas fa-list-ol"></i>'
        };
        return icons[type] || icons.info;
    }

    getDefaultTitle(type) {
        var titles = {
            error: "Error",
            warning: "Advertencia",
            success: "Exito",
            info: "Informacion",
            confirm: "Confirmar",
            form: "Formulario",
            guide: "Guia"
        };
        return titles[type] || "";
    }
}

// Create global instance
window.LaTandaPopup = LaTandaPopupManager.getInstance();

// Backwards compatibility
window.showNotification = function(message, type) {
    type = type || "info";
    if (type === "error") {
        window.LaTandaPopup.showError(message);
    } else if (type === "success") {
        window.LaTandaPopup.showSuccess(message);
    } else if (type === "warning") {
        window.LaTandaPopup.showWarning(message);
    } else {
        window.LaTandaPopup.showInfo(message);
    }
};

