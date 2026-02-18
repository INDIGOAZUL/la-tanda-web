/**
 * LA TANDA - Header Dropdown Manager
 * Wallet dropdown toggle and animations
 * @version 1.0
 */

const HeaderDropdown = {
    isOpen: false,
    elements: null,

    init: function() {
        this.elements = {
            wrapper: document.getElementById("walletWrapper"),
            dropdown: document.getElementById("ltWalletDropdown"),
            arrow: document.getElementById("walletArrow")
        };
    },

    toggle: function() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    open: function() {
        if (!this.elements || !this.elements.dropdown) {
            this.init();
        }
        this.isOpen = true;
        if (this.elements.dropdown) {
            this.elements.dropdown.classList.add("active");
        }
        if (this.elements.wrapper) {
            this.elements.wrapper.classList.add("open");
        }
        if (this.elements.arrow) {
            this.elements.arrow.style.transform = "rotate(180deg)";
        }
        if (window.HeaderSync) {
            window.HeaderSync.forceRefresh("balance");
        }
        if (window.LaTandaEvents) {
            window.LaTandaEvents.emit("dropdown:opened", { type: "wallet" });
        }
    },

    close: function() {
        if (!this.elements || !this.elements.dropdown) {
            this.init();
        }
        this.isOpen = false;
        if (this.elements.dropdown) {
            this.elements.dropdown.classList.remove("active");
        }
        if (this.elements.wrapper) {
            this.elements.wrapper.classList.remove("open");
        }
        if (this.elements.arrow) {
            this.elements.arrow.style.transform = "";
        }
        if (window.LaTandaEvents) {
            window.LaTandaEvents.emit("dropdown:closed", { type: "wallet" });
        }
    },

    closeAll: function() {
        this.close();
    },

    getState: function() {
        return { isOpen: this.isOpen };
    }
};

window.HeaderDropdown = HeaderDropdown;
