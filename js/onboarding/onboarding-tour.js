/**
 * LA TANDA - ONBOARDING TOUR
 * Version: 1.0.0
 * Guided first-time user tour for home-dashboard.html
 * - 5-7 steps highlighting key UI elements
 * - Vanilla JS, no external libraries
 * - localStorage key: onboarding_completed
 * - Spanish interface: Siguiente / Anterior / Omitir
 * - Dimmed overlay, directional arrow tooltips
 * - Auto-triggers on first visit only
 * - Mobile responsive at 375px
 */

(function () {
    "use strict";

    var STORAGE_KEY = "onboarding_completed";

    var TOUR_STEPS = [
        {
            target: "#mainFeed",
            title: "¡Bienvenido a La Tanda!",
            message: "Este es tu panel principal. Aquí puedes ver el feed social, publicaciones de tu comunidad y todas las novedades de la plataforma.",
            position: "center",
            fallback: "body"
        },
        {
            target: "#composeBox, .sf-compose, #composeInput",
            title: "Publica en el feed",
            message: "Usa este cuadro para escribir y compartir publicaciones con toda la comunidad de La Tanda.",
            position: "bottom",
            fallback: "#mainFeed"
        },
        {
            target: "#leftSidebar .nav-menu",
            title: "Navegación principal",
            message: "Desde aquí puedes acceder a todas las secciones: Explorar, Mensajes, Minería, Guardados y mucho más.",
            position: "right",
            fallback: "#leftSidebar"
        },
        {
            target: "#notificationsBtn",
            title: "Notificaciones",
            message: "Este botón te muestra todas tus notificaciones. Mantente al día con lo que pasa en tu comunidad.",
            position: "bottom",
            fallback: "#mainHeader"
        },
        {
            target: "#walletWrapper, #walletDisplay, #walletBalance",
            title: "Tu balance",
            message: "Aquí puedes ver tu saldo en LTD. Haz clic para ver el desglose de tu billetera y opciones de depósito o retiro.",
            position: "bottom",
            fallback: "#mainHeader"
        },
        {
            target: "a[href='/mia.html'], a[href='mia.html']",
            title: "MIA — Tu asistente con IA",
            message: "MIA es el asistente inteligente de La Tanda. Puedes hacerle preguntas sobre tandas, finanzas y mucho más.",
            position: "right",
            fallback: "#leftSidebar"
        },
        {
            target: "#mobileFab, .nav-post-btn[data-action='open-compose']",
            title: "¡Listo para comenzar!",
            message: "Ya conoces lo esencial. Publica tu primer mensaje, explora tandas y aprovecha todo lo que La Tanda tiene para ti. ¡Bienvenido!",
            position: "top",
            fallback: "body"
        }
    ];

    // -------------------------------------------------------
    // State
    // -------------------------------------------------------
    var currentStep = 0;
    var overlayEl = null;
    var tooltipEl = null;
    var highlightEl = null;
    var resizeTimer = null;

    // -------------------------------------------------------
    // Utility: find first matching element from a comma-separated selector
    // -------------------------------------------------------
    function findTarget(selector, fallback) {
        if (!selector) return null;
        var selectors = selector.split(",").map(function (s) { return s.trim(); });
        for (var i = 0; i < selectors.length; i++) {
            try {
                var el = document.querySelector(selectors[i]);
                if (el) return el;
            } catch (e) {}
        }
        // Try fallback
        if (fallback) {
            try {
                return document.querySelector(fallback) || document.body;
            } catch (e) {}
        }
        return document.body;
    }

    // -------------------------------------------------------
    // Check if tour should run
    // -------------------------------------------------------
    function shouldRun() {
        try {
            if (localStorage.getItem(STORAGE_KEY)) return false;
        } catch (e) {}
        // Only run on home-dashboard.html
        var path = window.location.pathname;
        if (path.indexOf("home-dashboard") === -1 && path !== "/" && path !== "") {
            return false;
        }
        return true;
    }

    // -------------------------------------------------------
    // Mark tour as completed
    // -------------------------------------------------------
    function markCompleted() {
        try {
            localStorage.setItem(STORAGE_KEY, "1");
        } catch (e) {}
    }

    // -------------------------------------------------------
    // Build and inject CSS
    // -------------------------------------------------------
    function injectCSS() {
        if (document.getElementById("lt-tour-styles")) return;
        var style = document.createElement("style");
        style.id = "lt-tour-styles";
        style.textContent = [
            "/* LA TANDA ONBOARDING TOUR */",
            "#lt-tour-overlay{",
            "  position:fixed;top:0;left:0;width:100%;height:100%;",
            "  background:rgba(0,0,0,0.72);z-index:19000;",
            "  transition:opacity 0.3s ease;",
            "}",
            "#lt-tour-highlight{",
            "  position:fixed;z-index:19001;",
            "  border-radius:8px;",
            "  box-shadow:0 0 0 9999px rgba(0,0,0,0.72),0 0 0 3px #00FFFF;",
            "  pointer-events:none;",
            "  transition:all 0.35s cubic-bezier(0.4,0,0.2,1);",
            "}",
            "#lt-tour-tooltip{",
            "  position:fixed;z-index:19002;",
            "  width:300px;max-width:calc(100vw - 24px);",
            "  background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);",
            "  border:1px solid rgba(0,255,255,0.25);",
            "  border-radius:14px;",
            "  box-shadow:0 16px 48px rgba(0,0,0,0.5),0 0 0 1px rgba(0,255,255,0.08);",
            "  padding:20px;",
            "  color:#f8fafc;",
            "  font-family:'Rajdhani',sans-serif;",
            "  transition:all 0.3s cubic-bezier(0.4,0,0.2,1);",
            "  opacity:0;transform:translateY(10px);",
            "}",
            "#lt-tour-tooltip.lt-tour-visible{opacity:1;transform:translateY(0);}",
            ".lt-tour-arrow{",
            "  position:absolute;width:12px;height:12px;",
            "  background:#1e293b;border:1px solid rgba(0,255,255,0.25);",
            "  transform:rotate(45deg);",
            "}",
            ".lt-tour-arrow.lt-arr-top{",
            "  top:-7px;left:50%;margin-left:-6px;",
            "  border-bottom:none;border-right:none;",
            "}",
            ".lt-tour-arrow.lt-arr-bottom{",
            "  bottom:-7px;left:50%;margin-left:-6px;",
            "  border-top:none;border-left:none;",
            "}",
            ".lt-tour-arrow.lt-arr-left{",
            "  left:-7px;top:50%;margin-top:-6px;",
            "  border-right:none;border-top:none;",
            "}",
            ".lt-tour-arrow.lt-arr-right{",
            "  right:-7px;top:50%;margin-top:-6px;",
            "  border-left:none;border-bottom:none;",
            "}",
            ".lt-tour-step-indicator{",
            "  font-size:11px;color:rgba(0,255,255,0.6);",
            "  margin-bottom:8px;letter-spacing:0.5px;",
            "}",
            ".lt-tour-title{",
            "  font-size:1rem;font-weight:700;color:#00FFFF;",
            "  margin-bottom:8px;line-height:1.3;",
            "}",
            ".lt-tour-message{",
            "  font-size:0.88rem;color:#cbd5e1;line-height:1.5;",
            "  margin-bottom:18px;",
            "}",
            ".lt-tour-actions{",
            "  display:flex;align-items:center;gap:8px;",
            "}",
            ".lt-tour-btn{",
            "  padding:9px 18px;border:none;border-radius:8px;",
            "  font-family:'Rajdhani',sans-serif;font-size:0.88rem;font-weight:600;",
            "  cursor:pointer;transition:all 0.2s ease;",
            "}",
            ".lt-tour-btn-next{",
            "  background:linear-gradient(135deg,#00FFFF,#00b4d8);",
            "  color:#0f172a;flex:1;",
            "}",
            ".lt-tour-btn-next:hover{opacity:0.88;transform:translateY(-1px);}",
            ".lt-tour-btn-prev{",
            "  background:rgba(255,255,255,0.08);color:#94a3b8;",
            "  border:1px solid rgba(255,255,255,0.1);",
            "}",
            ".lt-tour-btn-prev:hover{background:rgba(255,255,255,0.14);color:#f8fafc;}",
            ".lt-tour-btn-skip{",
            "  background:none;color:rgba(148,163,184,0.7);",
            "  font-size:0.8rem;margin-left:auto;",
            "  border:none;padding:9px 4px;",
            "}",
            ".lt-tour-btn-skip:hover{color:#94a3b8;}",
            ".lt-tour-progress{",
            "  display:flex;gap:5px;align-items:center;margin-bottom:14px;",
            "}",
            ".lt-tour-dot{",
            "  width:6px;height:6px;border-radius:50%;",
            "  background:rgba(255,255,255,0.18);transition:all 0.2s;",
            "}",
            ".lt-tour-dot.active{background:#00FFFF;transform:scale(1.3);}",
            ".lt-tour-dot.done{background:rgba(0,255,255,0.45);}",
            /* Mobile */
            "@media(max-width:420px){",
            "  #lt-tour-tooltip{width:calc(100vw - 20px);font-size:0.85rem;}",
            "  .lt-tour-title{font-size:0.95rem;}",
            "  .lt-tour-message{font-size:0.83rem;margin-bottom:14px;}",
            "  .lt-tour-btn{padding:8px 12px;font-size:0.83rem;}",
            "}"
        ].join("\n");
        document.head.appendChild(style);
    }

    // -------------------------------------------------------
    // Build DOM elements
    // -------------------------------------------------------
    function buildDOM() {
        // Overlay
        overlayEl = document.createElement("div");
        overlayEl.id = "lt-tour-overlay";
        document.body.appendChild(overlayEl);

        // Highlight ring
        highlightEl = document.createElement("div");
        highlightEl.id = "lt-tour-highlight";
        document.body.appendChild(highlightEl);

        // Tooltip
        tooltipEl = document.createElement("div");
        tooltipEl.id = "lt-tour-tooltip";
        document.body.appendChild(tooltipEl);
    }

    // -------------------------------------------------------
    // Render a step
    // -------------------------------------------------------
    function renderStep(index) {
        var step = TOUR_STEPS[index];
        var totalSteps = TOUR_STEPS.length;
        var isFirst = index === 0;
        var isLast = index === totalSteps - 1;

        var target = findTarget(step.target, step.fallback);
        var isCentered = (step.position === "center") || (target === document.body);

        // Build progress dots
        var dotsHtml = "";
        for (var d = 0; d < totalSteps; d++) {
            var cls = "lt-tour-dot";
            if (d === index) cls += " active";
            else if (d < index) cls += " done";
            dotsHtml += '<div class="' + cls + '"></div>';
        }

        // Prev button
        var prevHtml = isFirst
            ? ""
            : '<button class="lt-tour-btn lt-tour-btn-prev" id="ltTourPrev">Anterior</button>';

        // Next/Finish button
        var nextLabel = isLast ? "Finalizar" : "Siguiente";

        tooltipEl.innerHTML =
            '<div class="lt-tour-arrow" id="ltTourArrow"></div>' +
            '<div class="lt-tour-step-indicator">Paso ' + (index + 1) + ' de ' + totalSteps + '</div>' +
            '<div class="lt-tour-progress">' + dotsHtml + '</div>' +
            '<div class="lt-tour-title">' + escHtml(step.title) + '</div>' +
            '<div class="lt-tour-message">' + escHtml(step.message) + '</div>' +
            '<div class="lt-tour-actions">' +
                prevHtml +
                '<button class="lt-tour-btn lt-tour-btn-next" id="ltTourNext">' + nextLabel + '</button>' +
                '<button class="lt-tour-btn lt-tour-btn-skip" id="ltTourSkip">Omitir</button>' +
            '</div>';

        // Wire buttons
        var nextBtn = document.getElementById("ltTourNext");
        var prevBtn = document.getElementById("ltTourPrev");
        var skipBtn = document.getElementById("ltTourSkip");

        if (nextBtn) nextBtn.addEventListener("click", function () {
            if (isLast) { endTour(true); } else { goToStep(index + 1); }
        });
        if (prevBtn) prevBtn.addEventListener("click", function () { goToStep(index - 1); });
        if (skipBtn) skipBtn.addEventListener("click", function () { endTour(false); });

        // Position tooltip + highlight
        if (isCentered) {
            positionCentered();
        } else {
            positionRelative(target, step.position);
        }

        // Show
        setTimeout(function () { tooltipEl.classList.add("lt-tour-visible"); }, 60);
    }

    // -------------------------------------------------------
    // Position: centered (no highlight)
    // -------------------------------------------------------
    function positionCentered() {
        // Hide highlight
        highlightEl.style.display = "none";

        // Hide arrow
        var arrow = document.getElementById("ltTourArrow");
        if (arrow) arrow.style.display = "none";

        // Center tooltip
        tooltipEl.style.top = "50%";
        tooltipEl.style.left = "50%";
        tooltipEl.style.transform = "translate(-50%, -50%) translateY(0)";
        tooltipEl.style.transition = "opacity 0.3s ease";
    }

    // -------------------------------------------------------
    // Position: relative to a target element
    // -------------------------------------------------------
    function positionRelative(target, preferredPosition) {
        var rect = target.getBoundingClientRect();
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        var tW = 300;
        var margin = 14;
        var arrowSize = 14;

        // Reset transform override from center mode
        tooltipEl.style.transform = "";

        // Show highlight
        highlightEl.style.display = "block";
        var pad = 4;
        highlightEl.style.left = (rect.left - pad) + "px";
        highlightEl.style.top = (rect.top - pad) + "px";
        highlightEl.style.width = (rect.width + pad * 2) + "px";
        highlightEl.style.height = (rect.height + pad * 2) + "px";

        // Determine best position
        var position = preferredPosition || "bottom";

        // Override if no space
        if (position === "bottom" && rect.bottom + 160 > vh) position = "top";
        if (position === "top" && rect.top - 160 < 0) position = "bottom";
        if (position === "right" && rect.right + tW + margin > vw) position = "left";
        if (position === "left" && rect.left - tW - margin < 0) position = "right";

        // On narrow screens (<=420px), force bottom or top
        if (vw <= 420) {
            position = rect.top > vh / 2 ? "top" : "bottom";
        }

        var tooltipW = Math.min(tW, vw - 20);
        tooltipEl.style.width = tooltipW + "px";

        // Wait a tick to get actual tooltip height
        setTimeout(function () {
            var tooltipH = tooltipEl.offsetHeight || 180;
            var top, left;

            if (position === "bottom") {
                top = rect.bottom + margin;
                left = rect.left + rect.width / 2 - tooltipW / 2;
            } else if (position === "top") {
                top = rect.top - tooltipH - margin;
                left = rect.left + rect.width / 2 - tooltipW / 2;
            } else if (position === "right") {
                top = rect.top + rect.height / 2 - tooltipH / 2;
                left = rect.right + margin;
            } else { // left
                top = rect.top + rect.height / 2 - tooltipH / 2;
                left = rect.left - tooltipW - margin;
            }

            // Clamp within viewport
            left = Math.max(10, Math.min(left, vw - tooltipW - 10));
            top = Math.max(10, Math.min(top, vh - tooltipH - 10));

            tooltipEl.style.top = top + "px";
            tooltipEl.style.left = left + "px";

            // Position arrow
            var arrow = document.getElementById("ltTourArrow");
            if (arrow) {
                arrow.className = "lt-tour-arrow";
                if (position === "bottom") {
                    arrow.classList.add("lt-arr-top");
                    // Horizontal align relative to tooltip
                    var arrowLeft = (rect.left + rect.width / 2) - left - arrowSize / 2;
                    arrowLeft = Math.max(12, Math.min(arrowLeft, tooltipW - 24));
                    arrow.style.left = arrowLeft + "px";
                    arrow.style.top = "";
                    arrow.style.right = "";
                    arrow.style.bottom = "";
                    arrow.style.marginTop = "";
                    arrow.style.marginLeft = "";
                } else if (position === "top") {
                    arrow.classList.add("lt-arr-bottom");
                    var arrowLeft2 = (rect.left + rect.width / 2) - left - arrowSize / 2;
                    arrowLeft2 = Math.max(12, Math.min(arrowLeft2, tooltipW - 24));
                    arrow.style.left = arrowLeft2 + "px";
                    arrow.style.top = "";
                    arrow.style.right = "";
                    arrow.style.bottom = "";
                    arrow.style.marginTop = "";
                    arrow.style.marginLeft = "";
                } else if (position === "right") {
                    arrow.classList.add("lt-arr-left");
                    var arrowTop = (rect.top + rect.height / 2) - top - arrowSize / 2;
                    arrowTop = Math.max(12, Math.min(arrowTop, tooltipH - 24));
                    arrow.style.top = arrowTop + "px";
                    arrow.style.left = "";
                    arrow.style.right = "";
                    arrow.style.bottom = "";
                    arrow.style.marginTop = "";
                    arrow.style.marginLeft = "";
                } else { // left
                    arrow.classList.add("lt-arr-right");
                    var arrowTop2 = (rect.top + rect.height / 2) - top - arrowSize / 2;
                    arrowTop2 = Math.max(12, Math.min(arrowTop2, tooltipH - 24));
                    arrow.style.top = arrowTop2 + "px";
                    arrow.style.left = "";
                    arrow.style.right = "";
                    arrow.style.bottom = "";
                    arrow.style.marginTop = "";
                    arrow.style.marginLeft = "";
                }
            }
        }, 0);
    }

    // -------------------------------------------------------
    // Navigate to a step
    // -------------------------------------------------------
    function goToStep(index) {
        tooltipEl.classList.remove("lt-tour-visible");
        setTimeout(function () {
            currentStep = index;
            renderStep(currentStep);
        }, 200);
    }

    // -------------------------------------------------------
    // End tour
    // -------------------------------------------------------
    function endTour(completed) {
        markCompleted();

        // Fade out
        tooltipEl.classList.remove("lt-tour-visible");
        overlayEl.style.opacity = "0";
        setTimeout(function () {
            if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
            if (tooltipEl && tooltipEl.parentNode) tooltipEl.parentNode.removeChild(tooltipEl);
            if (highlightEl && highlightEl.parentNode) highlightEl.parentNode.removeChild(highlightEl);
            // Remove injected styles
            var s = document.getElementById("lt-tour-styles");
            if (s) s.parentNode.removeChild(s);
        }, 350);

        // Remove resize listener
        window.removeEventListener("resize", onResize);
    }

    // -------------------------------------------------------
    // Resize handler
    // -------------------------------------------------------
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            var step = TOUR_STEPS[currentStep];
            var target = findTarget(step.target, step.fallback);
            var isCentered = (step.position === "center") || (target === document.body);
            if (isCentered) {
                positionCentered();
            } else {
                positionRelative(target, step.position);
            }
        }, 120);
    }

    // -------------------------------------------------------
    // Escape HTML
    // -------------------------------------------------------
    function escHtml(str) {
        var d = document.createElement("div");
        d.textContent = str;
        return d.innerHTML;
    }

    // -------------------------------------------------------
    // Start the tour
    // -------------------------------------------------------
    function startTour() {
        if (!shouldRun()) return;

        injectCSS();
        buildDOM();
        currentStep = 0;
        renderStep(currentStep);
        window.addEventListener("resize", onResize);
    }

    // -------------------------------------------------------
    // Wait for critical components (social feed) to load
    // -------------------------------------------------------
    function init() {
        if (!shouldRun()) return;

        // Wait for DOM + a short delay to let components render
        var delay = 1800;
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", function () {
                setTimeout(startTour, delay);
            });
        } else {
            setTimeout(startTour, delay);
        }
    }

    // Public API
    window.LaTandaTour = {
        start: startTour,
        end: endTour,
        reset: function () {
            try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        }
    };

    init();
})();
