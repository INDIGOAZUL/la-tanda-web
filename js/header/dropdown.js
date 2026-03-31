/**
 * LA TANDA - Header Dropdown v2.0
 * Balance mini dropdown only (wallet dropdown removed)
 */
const HeaderDropdown = {
    isOpen: false,

    init() {},

    toggle() {
        var bm = document.getElementById("balanceMini");
        if (bm) bm.classList.toggle("open");
        this.isOpen = bm ? bm.classList.contains("open") : false;
    },

    close() {
        var bm = document.getElementById("balanceMini");
        if (bm) bm.classList.remove("open");
        this.isOpen = false;
    },

    closeAll() { this.close(); }
};
window.HeaderDropdown = HeaderDropdown;
