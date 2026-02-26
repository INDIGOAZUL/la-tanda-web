/**
 * LA TANDA - GUARDADOS (Saved Items)
 * Wired to GET /api/feed/social/bookmarks
 * Renders cards via SocialFeed.renderEventCard()
 * Version: 2.0
 */

const GuardadosModule = {
    API_BASE: "https://latanda.online",
    currentTab: "todos",
    events: [],
    offset: 0,
    limit: 20,
    hasMore: false,
    loading: false,
    searchQuery: "",
    scrollObserver: null,

    async init() {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("authToken");
        if (!token) {
            this.showAuthRequired();
            return;
        }

        this.showLoading();
        await this.fetchBookmarks(0);
        this.setupTabs();
        this.setupSearch();
        this.setupEngagementHandlers();
        this.setupInfiniteScroll();
    },

    showAuthRequired() {
        var container = document.getElementById("guardadosContainer");
        if (!container) return;
        container.innerHTML =
            '<div style="text-align:center;padding:60px 20px;">' +
                '<div style="width:80px;height:80px;background:rgba(0,255,255,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">' +
                    '<i class="fas fa-lock" style="font-size:2rem;color:#00FFFF;"></i>' +
                '</div>' +
                '<h3 style="color:#fff;margin-bottom:8px;">Inicia sesion para ver tus guardados</h3>' +
                '<p style="color:#888;font-size:0.9rem;margin-bottom:20px;">Necesitas una cuenta para guardar y ver contenido</p>' +
                '<a href="auth-enhanced.html" style="display:inline-block;padding:10px 24px;background:rgba(0,255,255,0.15);border:1px solid rgba(0,255,255,0.3);border-radius:20px;color:#00FFFF;text-decoration:none;font-size:0.9rem;">Iniciar Sesion</a>' +
            '</div>';
        document.getElementById("emptyState").style.display = "none";
    },

    showLoading() {
        var container = document.getElementById("guardadosContainer");
        if (!container) return;
        container.innerHTML =
            '<div style="text-align:center;padding:40px;">' +
                '<div style="width:40px;height:40px;border:3px solid rgba(0,255,255,0.2);border-top-color:#00FFFF;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>' +
                '<p style="color:#888;font-size:0.9rem;">Cargando guardados...</p>' +
            '</div>' +
            '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
    },

    async fetchBookmarks(offset) {
        if (this.loading) return;
        this.loading = true;

        var token = localStorage.getItem("auth_token") || localStorage.getItem("authToken");
        if (!token) return;

        try {
            var response = await fetch("/api/feed/social/bookmarks?limit=" + this.limit + "&offset=" + offset, {
                headers: { "Authorization": "Bearer " + token }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.showAuthRequired();
                    return;
                }
                throw new Error("HTTP " + response.status);
            }

            var data = await response.json();
            if (!data.success || !data.data) {
                throw new Error("Invalid response");
            }

            var newEvents = data.data.events || [];
            if (offset === 0) {
                this.events = newEvents;
            } else {
                this.events = this.events.concat(newEvents);
            }

            this.offset = offset + newEvents.length;
            this.hasMore = data.data.pagination ? data.data.pagination.has_more : false;

            this.updateStats();
            this.renderItems();
        } catch (error) {
            console.error("[Guardados] Fetch error:", error);
            if (offset === 0) {
                var container = document.getElementById("guardadosContainer");
                if (container) {
                    container.innerHTML =
                        '<div style="text-align:center;padding:40px;color:#888;">' +
                            '<i class="fas fa-exclamation-triangle" style="font-size:1.5rem;color:#ef4444;margin-bottom:12px;display:block;"></i>' +
                            '<p>Error al cargar guardados</p>' +
                            '<button onclick="GuardadosModule.fetchBookmarks(0)" style="margin-top:12px;padding:8px 20px;background:rgba(0,255,255,0.15);border:1px solid rgba(0,255,255,0.3);border-radius:16px;color:#00FFFF;cursor:pointer;">Reintentar</button>' +
                        '</div>';
                }
            }
        } finally {
            this.loading = false;
        }
    },

    getFilteredEvents() {
        var filtered = this.events;

        // Tab filter
        if (this.currentTab === "publicaciones") {
            filtered = filtered.filter(function(ev) { return ev.event_type === "user_post"; });
        } else if (this.currentTab === "productos") {
            filtered = filtered.filter(function(ev) { return ev.event_type === "product_posted"; });
        }

        // Search filter
        if (this.searchQuery) {
            var q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(function(ev) {
                var title = (ev.title || "").toLowerCase();
                var desc = (ev.description || "").toLowerCase();
                var actor = (ev.actor && ev.actor.name ? ev.actor.name : "").toLowerCase();
                return title.indexOf(q) !== -1 || desc.indexOf(q) !== -1 || actor.indexOf(q) !== -1;
            });
        }

        return filtered;
    },

    renderItems() {
        var container = document.getElementById("guardadosContainer");
        var emptyState = document.getElementById("emptyState");
        if (!container) return;

        var filtered = this.getFilteredEvents();

        if (filtered.length === 0) {
            container.innerHTML = "";
            if (this.events.length === 0 && !this.searchQuery && this.currentTab === "todos") {
                // True empty — no bookmarks at all
                emptyState.style.display = "block";
            } else {
                // Filtered empty
                emptyState.style.display = "none";
                container.innerHTML =
                    '<div style="text-align:center;padding:40px;color:#888;">' +
                        '<i class="far fa-bookmark" style="font-size:1.5rem;margin-bottom:12px;display:block;"></i>' +
                        '<p>No se encontraron guardados' +
                            (this.searchQuery ? ' para &quot;' + this.escapeHtml(this.searchQuery) + '&quot;' : ' en esta categoria') +
                        '</p>' +
                    '</div>';
            }
            this.addScrollSentinel(container);
            return;
        }

        emptyState.style.display = "none";

        // Use SocialFeed.renderEventCard for each event
        var html = filtered.map(function(event) {
            return SocialFeed.renderEventCard(event);
        }).join("");

        container.innerHTML = html;
        this.addScrollSentinel(container);
    },

    addScrollSentinel(container) {
        // Remove old sentinel
        var old = document.getElementById("guardadosScrollSentinel");
        if (old) old.remove();

        if (this.hasMore) {
            var sentinel = document.createElement("div");
            sentinel.id = "guardadosScrollSentinel";
            sentinel.style.height = "1px";
            container.appendChild(sentinel);

            // Re-observe
            if (this.scrollObserver) {
                this.scrollObserver.observe(sentinel);
            }
        }
    },

    updateStats() {
        var total = this.events.length;
        var posts = 0;
        var productos = 0;

        for (var i = 0; i < this.events.length; i++) {
            if (this.events[i].event_type === "user_post") posts++;
            else if (this.events[i].event_type === "product_posted") productos++;
        }

        var statTodos = document.getElementById("statTodos");
        var statPosts = document.getElementById("statPosts");
        var statProductos = document.getElementById("statProductos");

        if (statTodos) statTodos.textContent = total;
        if (statPosts) statPosts.textContent = posts;
        if (statProductos) statProductos.textContent = productos;
    },

    setupTabs() {
        var self = this;
        document.querySelectorAll(".guardados-tab").forEach(function(tab) {
            tab.addEventListener("click", function(e) {
                var target = e.target.closest(".guardados-tab");
                if (!target) return;

                document.querySelectorAll(".guardados-tab").forEach(function(t) {
                    t.classList.remove("active");
                    t.style.background = "transparent";
                    t.style.borderColor = "rgba(255,255,255,0.1)";
                    t.style.color = "#888";
                });
                target.classList.add("active");
                target.style.background = "rgba(0,255,255,0.15)";
                target.style.borderColor = "rgba(0,255,255,0.3)";
                target.style.color = "#00FFFF";

                self.currentTab = target.dataset.tab;
                self.renderItems();
            });
        });
    },

    setupSearch() {
        var self = this;
        var searchInput = document.getElementById("guardadosSearch");
        if (!searchInput) return;
        var debounceTimer;

        searchInput.addEventListener("input", function(e) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                self.searchQuery = e.target.value.trim();
                self.renderItems();
            }, 300);
        });
    },

    setupEngagementHandlers() {
        var self = this;
        var container = document.getElementById("guardadosContainer");
        if (!container) return;

        container.addEventListener("click", async function(e) {
            var likeBtn = e.target.closest(".like-btn");
            var bookmarkBtn = e.target.closest(".bookmark-btn");
            var commentBtn = e.target.closest(".comment-btn");
            var shareBtn = e.target.closest(".share-btn");
            var avatarEl = e.target.closest(".actor-avatar[data-user-id]");
            var lightboxImg = e.target.closest(".lightbox-trigger");

            if (likeBtn) {
                e.preventDefault();
                await SocialFeed.toggleLike(likeBtn);
                // Update local event state
                var likeId = likeBtn.dataset.id;
                var likeEvent = self.events.find(function(ev) { return String(ev.id) === likeId; });
                if (likeEvent) {
                    likeEvent.is_liked = likeBtn.classList.contains("liked");
                }
                return;
            }

            if (bookmarkBtn) {
                e.preventDefault();
                var eventId = bookmarkBtn.dataset.id;
                var wasBookmarked = bookmarkBtn.classList.contains("bookmarked");

                await SocialFeed.toggleBookmark(bookmarkBtn);

                // If successfully unbookmarked (was bookmarked, now not)
                if (wasBookmarked && !bookmarkBtn.classList.contains("bookmarked")) {
                    var card = bookmarkBtn.closest(".social-card");
                    if (card) {
                        card.style.transition = "opacity 0.3s, max-height 0.3s, margin 0.3s, padding 0.3s";
                        card.style.opacity = "0";
                        card.style.maxHeight = card.offsetHeight + "px";
                        card.style.overflow = "hidden";

                        setTimeout(function() {
                            card.style.maxHeight = "0";
                            card.style.marginTop = "0";
                            card.style.marginBottom = "0";
                            card.style.paddingTop = "0";
                            card.style.paddingBottom = "0";
                        }, 50);

                        setTimeout(function() {
                            // Remove from events array
                            self.events = self.events.filter(function(ev) {
                                return String(ev.id) !== eventId;
                            });
                            self.offset = Math.max(0, self.offset - 1);
                            self.updateStats();

                            // Remove card from DOM
                            card.remove();

                            // Check if empty
                            if (self.events.length === 0) {
                                self.renderItems();
                            }
                        }, 350);
                    }
                }
                return;
            }

            if (commentBtn) {
                e.preventDefault();
                var commentId = commentBtn.dataset.id;
                SocialFeed.openComments(commentId);
                return;
            }

            if (shareBtn) {
                e.preventDefault();
                var shareId = shareBtn.dataset.id;
                // Find event in our array for share text
                var shareEvent = self.events.find(function(ev) { return String(ev.id) === shareId; });
                var shareUrl = window.location.origin + "/home-dashboard.html?event=" + shareId;
                var shareText = shareEvent ? (shareEvent.title || shareEvent.description || "La Tanda") : "La Tanda";

                if (navigator.share) {
                    navigator.share({ title: "La Tanda", text: shareText, url: shareUrl }).catch(function() {});
                } else {
                    navigator.clipboard.writeText(shareUrl).then(function() {
                        window.LaTandaPopup && window.LaTandaPopup.showSuccess("Link copiado al portapapeles");
                    });
                }
                return;
            }

            if (avatarEl) {
                e.preventDefault();
                var userId = avatarEl.dataset.userId;
                if (userId && window.UserMiniProfile) {
                    window.UserMiniProfile.show(userId, avatarEl);
                }
                return;
            }

            if (lightboxImg) {
                e.preventDefault();
                if (typeof SocialFeed.openLightbox === "function") {
                    SocialFeed.openLightbox(lightboxImg);
                }
                return;
            }
        });
    },

    setupInfiniteScroll() {
        var self = this;
        var sentinel = document.getElementById("guardadosScrollSentinel");

        this.scrollObserver = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting && self.hasMore && !self.loading) {
                self.fetchBookmarks(self.offset);
            }
        }, { rootMargin: "200px" });

        if (sentinel) {
            this.scrollObserver.observe(sentinel);
        }
    },

    escapeHtml(text) {
        if (text == null) return "";
        var div = document.createElement("div");
        div.textContent = String(text);
        return div.innerHTML;
    }
};

document.addEventListener("DOMContentLoaded", function() {
    GuardadosModule.init();
});
