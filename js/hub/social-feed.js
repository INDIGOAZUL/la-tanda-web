/**
 * LA TANDA - Enhanced Social Feed
 * Feed social con avatares, engagement, filtros y discovery
 * Version: 8.0.0
 * Updated: 2026-02-03
 * Changes: Added @mentions and #hashtags support for user posts
 */

const SocialFeed = {
    container: null,
    events: [],
    isLoading: false,
    hasMore: true,
    offset: 0,
    limit: 20,
    observer: null,
    currentTab: "todos",
    selectedMedia: [],
    maxMedia: 4,
    maxImageSize: 5 * 1024 * 1024,  // 5MB for images
    maxVideoSize: 50 * 1024 * 1024, // 50MB for videos
    maxVideoDuration: 60, // 60 seconds
    selectedImages: [],  // Array of {file, previewUrl}
    maxImages: 4,
    currentUserId: null, // Track logged in user
    currentHashtag: null, // Track active hashtag filter
    currentSearch: null, // Track active search filter
    viewObserver: null, // IntersectionObserver for view tracking
    viewTimers: {}, // Pending 2-second timers per event ID
    pendingViews: new Set(), // Event IDs ready to flush
    viewFlushInterval: null, // 3-second flush interval

    tabs: [
        { id: "todos", label: "Todos", icon: "fa-globe", filter: null },
        { id: "trending", label: "Trending", icon: "fa-fire", filter: "trending" },
        { id: "grupos", label: "Grupos", icon: "fa-users", filter: "group_created,group_joined" },
        { id: "mercado", label: "Mercado", icon: "fa-shopping-bag", filter: "product_posted" },
        { id: "loteria", label: "Loteria", icon: "fa-dice", filter: "lottery_result,prediction_shared" },
        { id: "logros", label: "Logros", icon: "fa-trophy", filter: "milestone" }
    ],

    eventTypes: {
        group_created: { icon: "fa-users", color: "#00FFFF", label: "Nuevo Grupo" },
        group_joined: { icon: "fa-user-plus", color: "#22d55e", label: "Nuevo Miembro" },
        product_posted: { icon: "fa-shopping-bag", color: "#fbbf24", label: "Producto" },
        lottery_result: { icon: "fa-dice", color: "#8b5cf6", label: "Sorteo" },
        prediction_shared: { icon: "fa-star", color: "#ec4899", label: "Prediccion" },
        milestone: { icon: "fa-trophy", color: "#f59e0b", label: "Logro" },
        user_post: { icon: "fa-comment-alt", color: "#00FFFF", label: "Publicacion" }
    },

    defaultConfig: { icon: "fa-bell", color: "#6b7280", label: "Actividad" },

    init(containerId) { if (this.initialized) {return; }
        this.container = document.getElementById(containerId);
        if (!this.container) {
            return;
        }
        this.loadCurrentUserId();
        this.render();

        // Check URL for hashtag filter
        const urlParams = new URLSearchParams(window.location.search);
        const hashtagParam = urlParams.get("hashtag");
        if (hashtagParam) {
            this.currentHashtag = hashtagParam;
            // Delay showing filter bar until after render
            setTimeout(() => this.showHashtagFilter(hashtagParam), 100);
        }

        // Check URL for shared event deep link (?event=ID)
        this.deepLinkEventId = urlParams.get("event") || null;

        // Handle incoming share from other apps (PWA Share Target)
        const sharedTitle = urlParams.get("shared_title") || "";
        const sharedText = urlParams.get("shared_text") || "";
        const sharedUrl = urlParams.get("shared_url") || "";
        if (sharedTitle || sharedText || sharedUrl) {
            this._pendingShare = [sharedTitle, sharedText, sharedUrl].filter(Boolean).join(" ");
            // Clean URL to remove share params
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, "", cleanUrl);
        }

        this.loadEvents();
        this.setupIntersectionObserver();
        this.setupViewTracking();
        this.attachEngagementHandlers();
        this.attachTabHandlers();
        this.attachPostMenuHandlers();
        this.initialized = true;},

    loadCurrentUserId() {
        try {
            // Try latanda_user object first
            const storedUser = localStorage.getItem("latanda_user") || sessionStorage.getItem("latanda_user");
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                this.currentUserId = userData.id || userData.user_id || null;
            }
            // Fallback to separate user_id/userId keys
            if (!this.currentUserId) {
                this.currentUserId = localStorage.getItem("user_id") || localStorage.getItem("userId") || null;
            }
} catch (e) {
        }
    },

    render() {
        if (!this.container) return;

        const tabsHTML = this.tabs.map(tab =>
            '<button class="feed-tab ' + (tab.id === this.currentTab ? 'active' : '') + '" data-tab="' + tab.id + '">' +
                '<i class="fas ' + tab.icon + '"></i>' +
                '<span>' + tab.label + '</span>' +
            '</button>'
        ).join('');

        let userName = "Usuario";
        let userAvatar = "";
        try {
            const storedUser = localStorage.getItem("latanda_user") || sessionStorage.getItem("latanda_user");
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                userName = userData.name || userData.full_name || "Usuario";
                userAvatar = userData.avatar_url || userData.profile_image_url || "";
            }
        } catch (e) {
        }
        const userInitials = userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

        const avatarHtml = userAvatar
            ? '<img src="' + this.escapeHtml(userAvatar) + '" alt="' + this.escapeHtml(userName) + '" class="avatar-fallback-img">'
            : '';

        this.container.innerHTML =
            '<div class="social-feed-wrapper">' +
                '<div class="feed-tabs-container">' +
                    '<div class="feed-tabs" id="feedTabs">' + tabsHTML + '</div>' +
                '</div>' +
                '<div class="compose-box" id="composeBox">' +
                    '<div class="compose-box-inner">' +
                        '<div class="compose-avatar ' + (userAvatar ? 'has-image' : '') + '">' +
                            avatarHtml +
                            '<span class="compose-avatar-initials" style="' + (userAvatar ? 'display:none' : '') + '">' + userInitials + '</span>' +
                        '</div>' +
                        '<div class="compose-content">' +
                            '<div class="compose-input-wrapper">' +
                                '<textarea class="compose-input" id="composeInput" placeholder="¿Qué está pasando?" rows="1"></textarea>' +
                            '</div>' +
                            '<div class="compose-images-preview" id="composeImagesPreview" style="display: none;"></div>' +
                            '<div class="compose-link-preview" id="composeLinkPreview" style="display: none;"></div>' +
                            '<div class="compose-toolbar">' +
                                '<div class="compose-tools">' +
                                    '<div class="compose-media-wrapper">' +
                                        '<button class="compose-tool" id="composeMediaBtn" title="Agregar foto o video">' +
                                            '<i class="fas fa-photo-video"></i>' +
                                        '</button>' +
                                        '<div class="compose-media-menu" id="composeMediaMenu">' +
                                            '<button class="compose-media-option" data-type="photo"><i class="fas fa-camera"></i> Tomar foto</button>' +
                                            '<button class="compose-media-option" data-type="video-capture"><i class="fas fa-video"></i> Grabar video</button>' +
                                            '<button class="compose-media-option" data-type="gallery"><i class="fas fa-folder-open"></i> Elegir de galeria</button>' +
                                        '</div>' +
                                        '<input type="file" id="composeMediaInput" accept="image/*,video/*" multiple style="display:none;">' +
                                        '<input type="file" id="composeCameraInput" accept="image/*" capture="environment" style="display:none;">' +
                                        '<input type="file" id="composeVideoCaptureInput" accept="video/*" capture="environment" style="display:none;">' +
                                    '</div>' +
                                    '<div class="compose-gif-wrapper">' +
                                        '<button class="compose-tool" id="composeGifBtn" title="GIF">' +
                                            '<i class="fas fa-film"></i>' +
                                        '</button>' +
                                    '</div>' +
                                    '<div class="compose-poll-wrapper">' +
                                        '<button class="compose-tool" id="composePollBtn" title="Encuesta">' +
                                            '<i class="fas fa-poll"></i>' +
                                        '</button>' +
                                    '</div>' +
                                    '<div class="compose-emoji-wrapper">' +
                                        '<button class="compose-tool" id="composeEmojiBtn" title="Emoji">' +
                                            '<i class="fas fa-smile"></i>' +
                                        '</button>' +
                                    '</div>' +
                                    '<button class="compose-tool" id="composeLocationBtn" title="Ubicacion">' +
                                        '<i class="fas fa-map-marker-alt"></i>' +
                                    '</button>' +
                                    '<button class="compose-tool" id="composeIncognitoBtn" title="Incognito">' +
                                        '<i class="fas fa-user-secret"></i>' +
                                    '</button>' +
                                '</div>' +
                                '<button class="compose-submit-btn" id="composeSubmit">Publicar</button>' +
                            '</div>' +
                            // Panels inside compose-content so they position correctly
                            '<div class="compose-emoji-panel" id="composeEmojiPanel" style="display:none;">' +
                                '<div class="emoji-tabs">' +
                                    '<button class="emoji-tab active" data-cat="caritas">Caritas</button>' +
                                    '<button class="emoji-tab" data-cat="manos">Manos</button>' +
                                    '<button class="emoji-tab" data-cat="corazones">Corazones</button>' +
                                    '<button class="emoji-tab" data-cat="objetos">Objetos</button>' +
                                    '<button class="emoji-tab" data-cat="simbolos">Simbolos</button>' +
                                '</div>' +
                                '<div class="emoji-grid" id="emojiGrid"></div>' +
                            '</div>' +
                            '<div class="compose-poll-panel" id="composePollPanel" style="display:none;">' +
                                '<div class="poll-panel-header">' +
                                    '<span>Crear encuesta</span>' +
                                    '<button class="poll-panel-close" id="pollPanelClose"><i class="fas fa-times"></i></button>' +
                                '</div>' +
                                '<div class="poll-options-list" id="pollOptionsList">' +
                                    '<input class="poll-option-input" type="text" placeholder="Opcion 1" maxlength="80">' +
                                    '<input class="poll-option-input" type="text" placeholder="Opcion 2" maxlength="80">' +
                                '</div>' +
                                '<button class="poll-add-option" id="pollAddOption"><i class="fas fa-plus"></i> Agregar opcion</button>' +
                                '<div class="poll-duration-row">' +
                                    '<label>Duracion:</label>' +
                                    '<select id="pollDuration">' +
                                        '<option value="24">1 dia</option>' +
                                        '<option value="72" selected>3 dias</option>' +
                                        '<option value="168">7 dias</option>' +
                                    '</select>' +
                                '</div>' +
                            '</div>' +
                            '<div class="compose-gif-panel" id="composeGifPanel" style="display:none;">' +
                                '<div class="gif-search-wrapper">' +
                                    '<input type="text" class="gif-search-input" id="gifSearchInput" placeholder="Buscar GIFs...">' +
                                    '<i class="fas fa-search gif-search-icon"></i>' +
                                '</div>' +
                                '<div class="gif-grid" id="gifGrid">' +
                                    '<div class="gif-loading"><i class="fas fa-spinner fa-spin"></i></div>' +
                                '</div>' +
                                '<div class="gif-attribution">Powered by Klipy</div>' +
                            '</div>' +
                            // Location Panel
                            '<div class="compose-location-panel" id="composeLocationPanel" style="display:none;">' +
                                '<div class="location-panel-header">' +
                                    '<span><i class="fas fa-map-marker-alt"></i> Ubicacion</span>' +
                                    '<button class="location-panel-close" id="locationPanelClose"><i class="fas fa-times"></i></button>' +
                                '</div>' +
                                '<div class="location-panel-body">' +
                                    '<input type="text" class="location-input" id="locationInput" placeholder="Ej: San Pedro Sula, Honduras" maxlength="100">' +
                                    '<button class="location-detect-btn" id="locationDetectBtn" title="Detectar ubicacion"><i class="fas fa-crosshairs"></i> Detectar</button>' +
                                '</div>' +
                            '</div>' +
                            // Incognito indicator
                            '<div class="compose-incognito-bar" id="composeIncognitoBar" style="display:none;">' +
                                '<i class="fas fa-user-secret"></i>' +
                                '<span>Modo incognito activado — publicaras como anonimo</span>' +
                                '<button class="incognito-bar-close" id="incognitoBarClose"><i class="fas fa-times"></i></button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="camera-modal" id="cameraModal">' +
                    '<div class="camera-modal-content">' +
                        '<div class="camera-modal-header">' +
                            '<span class="camera-modal-title" id="cameraModalTitle">Tomar foto</span>' +
                            '<button class="camera-modal-close" id="cameraModalClose"><i class="fas fa-times"></i></button>' +
                        '</div>' +
                        '<div class="camera-modal-body">' +
                            '<video id="cameraPreview" autoplay playsinline muted></video>' +
                            '<canvas id="cameraCanvas" style="display:none;"></canvas>' +
                        '</div>' +
                        '<div class="camera-modal-footer">' +
                            '<button class="camera-btn camera-btn-switch" id="cameraSwitchBtn" title="Cambiar camara"><i class="fas fa-sync-alt"></i></button>' +
                            '<button class="camera-btn camera-btn-capture" id="cameraCaptureBtn"><i class="fas fa-circle"></i></button>' +
                            '<button class="camera-btn camera-btn-record" id="cameraRecordBtn" style="display:none;"><i class="fas fa-circle"></i></button>' +
                            '<span class="camera-timer" id="cameraTimer" style="display:none;">00:00</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="social-feed-list" id="socialFeedList">' +
                    '<div class="social-feed-loading">' +
                        '<i class="fas fa-spinner fa-spin"></i>' +
                        '<span>Cargando actividad...</span>' +
                    '</div>' +
                '</div>' +
                '<div id="socialFeedSentinel" class="social-feed-sentinel"></div>' +
            '</div>' +
            // Edit Modal
            '<div class="post-edit-modal" id="postEditModal" style="display:none;">' +
                '<div class="post-edit-modal-overlay"></div>' +
                '<div class="post-edit-modal-content">' +
                    '<div class="post-edit-modal-header">' +
                        '<h3>Editar publicacion</h3>' +
                        '<button class="post-edit-modal-close" id="postEditModalClose">' +
                            '<i class="fas fa-times"></i>' +
                        '</button>' +
                    '</div>' +
                    '<div class="post-edit-modal-body">' +
                        '<textarea class="post-edit-textarea" id="postEditTextarea" placeholder="¿Qué está pasando?" maxlength="500"></textarea>' +
                        '<div class="post-edit-char-count"><span id="postEditCharCount">0</span>/500</div>' +
                    '</div>' +
                    '<div class="post-edit-modal-footer">' +
                        '<button class="post-edit-cancel" id="postEditCancel">Cancelar</button>' +
                        '<button class="post-edit-save" id="postEditSave">Guardar</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            // Image Lightbox
            '<div class="media-lightbox" id="mediaLightbox">' +
                '<div class="lightbox-backdrop"></div>' +
                '<button class="lightbox-close" id="lightboxClose"><i class="fas fa-times"></i></button>' +
                '<div class="lightbox-counter" id="lightboxCounter"></div>' +
                '<button class="lightbox-nav lightbox-prev" id="lightboxPrev"><i class="fas fa-chevron-left"></i></button>' +
                '<button class="lightbox-nav lightbox-next" id="lightboxNext"><i class="fas fa-chevron-right"></i></button>' +
                '<div class="lightbox-content" id="lightboxContent">' +
                    '<img id="lightboxImg" src="" alt="">' +
                    '<video id="lightboxVideo" controls playsinline preload="auto" style="display:none;max-width:100%;max-height:90vh;object-fit:contain;"></video>' +
                '</div>' +
            '</div>';

        this.setupImageHandlers();
        this.setupVideoOverlays();
        this.setupAutoResize();
        this.setupLinkPreview();
        this.setupMentionAutocomplete();
        this.setupEditModalHandlers();
        this.setupSearch();
        this.setupEmojiPicker();
        this.setupPollCreator();
        this.setupGifSelector();
        this.setupLocation();
        this.setupIncognito();
        this.setupLightbox();
    },

    setupImageHandlers() {
        const mediaBtn = document.getElementById("composeMediaBtn");
        const mediaMenu = document.getElementById("composeMediaMenu");
        const mediaInput = document.getElementById("composeMediaInput");
        const cameraInput = document.getElementById("composeCameraInput");
        const submitBtn = document.getElementById("composeSubmit");
        const previewContainer = document.getElementById("composeImagesPreview");

        // Toggle menu on button click
        if (mediaBtn && mediaMenu) {
            mediaBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (this.selectedImages.length >= this.maxMedia) {
                    window.LaTandaPopup && window.LaTandaPopup.showWarning("Maximo " + this.maxMedia + " archivos");
                    return;
                }
                mediaMenu.classList.toggle("show");
            });
        }

        // Handle menu options
        if (mediaMenu) {
            mediaMenu.addEventListener("click", (e) => {
                const option = e.target.closest(".compose-media-option");
                if (!option) return;
                e.stopPropagation();
                mediaMenu.classList.remove("show");
                const type = option.dataset.type;
                if (type === "gallery" && mediaInput) mediaInput.click();
                if (type === "photo") {
                    if (this.isMobileDevice()) {
                        if (cameraInput) cameraInput.click();
                    } else {
                        this.openCameraModal("photo");
                    }
                }
                if (type === "video-capture") {
                    if (this.isMobileDevice()) {
                        const videoCaptureInput = document.getElementById("composeVideoCaptureInput");
                        if (videoCaptureInput) videoCaptureInput.click();
                    } else {
                        this.openCameraModal("video");
                    }
                }
            });
        }

        // Close menu on outside click
        document.addEventListener("click", (e) => {
            if (mediaMenu && !e.target.closest(".compose-media-wrapper")) {
                mediaMenu.classList.remove("show");
            }
        });

        // Handle file inputs
        if (mediaInput) mediaInput.addEventListener("change", (e) => this.handleMediaSelect(e));
        if (cameraInput) cameraInput.addEventListener("change", (e) => this.handleMediaSelect(e));
        const videoCaptureInput = document.getElementById("composeVideoCaptureInput");
        if (videoCaptureInput) videoCaptureInput.addEventListener("change", (e) => this.handleMediaSelect(e));

        // Event delegation for remove buttons
        if (previewContainer) {
            previewContainer.addEventListener("click", (e) => {
                const removeBtn = e.target.closest(".remove-image");
                if (removeBtn) {
                    const index = parseInt(removeBtn.dataset.index);
                    this.removeImage(index);
                }
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener("click", () => this.handleCompose());
        }
    },

    setupEditModalHandlers() {
        const modal = document.getElementById("postEditModal");
        const overlay = modal ? modal.querySelector(".post-edit-modal-overlay") : null;
        const closeBtn = document.getElementById("postEditModalClose");
        const cancelBtn = document.getElementById("postEditCancel");
        const saveBtn = document.getElementById("postEditSave");
        const textarea = document.getElementById("postEditTextarea");
        const charCount = document.getElementById("postEditCharCount");

        if (overlay) {
            overlay.addEventListener("click", () => this.closeEditModal());
        }
        if (closeBtn) {
            closeBtn.addEventListener("click", () => this.closeEditModal());
        }
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => this.closeEditModal());
        }
        if (saveBtn) {
            saveBtn.addEventListener("click", () => this.saveEdit());
        }
        if (textarea && charCount) {
            textarea.addEventListener("input", () => {
                charCount.textContent = textarea.value.length;
            });
        }
    },

    handleImageSelect(e) {
        // Legacy - redirect to handleMediaSelect
        this.handleMediaSelect(e);
    },

    async handleMediaSelect(e) {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        const videoTypes = ["video/mp4", "video/quicktime", "video/webm", "video/mov"];
        const maxImageSize = this.maxImageSize || 5 * 1024 * 1024;
        const maxVideoSize = this.maxVideoSize || 50 * 1024 * 1024;
        const maxVideoDuration = this.maxVideoDuration || 60;

        for (const file of files) {
            if (this.selectedImages.length >= (this.maxMedia || 4)) {
                window.LaTandaPopup && window.LaTandaPopup.showWarning("Maximo " + (this.maxMedia || 4) + " archivos");
                break;
            }

            const isImage = imageTypes.includes(file.type);
            const isVideo = videoTypes.includes(file.type) || file.type.startsWith("video/");

            if (!isImage && !isVideo) {
                window.LaTandaPopup && window.LaTandaPopup.showWarning(file.name + ": formato no soportado");
                continue;
            }

            // Size validation
            if (isImage && file.size > maxImageSize) {
                window.LaTandaPopup && window.LaTandaPopup.showWarning(file.name + ": imagen excede 5MB");
                continue;
            }
            if (isVideo && file.size > maxVideoSize) {
                window.LaTandaPopup && window.LaTandaPopup.showWarning(file.name + ": video excede 50MB");
                continue;
            }

            // Duration validation for videos
            if (isVideo) {
                try {
                    const duration = await this.getVideoDuration(file);
                    if (duration > maxVideoDuration) {
                        window.LaTandaPopup && window.LaTandaPopup.showWarning(file.name + ": video excede " + maxVideoDuration + " segundos");
                        continue;
                    }
                } catch (err) {
                }
            }

            this.selectedImages.push({
                file: file,
                previewUrl: URL.createObjectURL(file),
                type: isVideo ? "video" : "image"
            });
        }

        e.target.value = "";
        this.renderImagePreviews();
        this.updateImageButton();
},

    getVideoDuration(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");
            video.preload = "metadata";
            video.onloadedmetadata = () => {
                URL.revokeObjectURL(video.src);
                resolve(video.duration);
            };
            video.onerror = reject;
            video.src = URL.createObjectURL(file);
        });
    },

    renderImagePreviews() {
        const container = document.getElementById("composeImagesPreview");
        if (!container) return;

        if (this.selectedImages.length === 0) {
            container.style.display = "none";
            container.innerHTML = "";
            return;
        }

        container.style.display = "grid";
        container.className = "compose-images-preview preview-" + this.selectedImages.length;

        container.innerHTML = this.selectedImages.map((media, index) => {
            const isVideo = media.type === "video" || (media.file && media.file.type.startsWith("video/"));
            if (isVideo) {
                return '<div class="preview-item preview-video">' +
                    '<video src="' + media.previewUrl + '" muted playsinline preload="auto"></video>' +
                    '<div class="video-badge"><i class="fas fa-play"></i></div>' +
                    '<button class="remove-image" data-index="' + index + '" title="Eliminar">' +
                        '<i class="fas fa-times"></i>' +
                    '</button>' +
                '</div>';
            } else {
                return '<div class="preview-item">' +
                    '<img src="' + media.previewUrl + '" alt="Preview ' + (index + 1) + '">' +
                    '<button class="remove-image" data-index="' + index + '" title="Eliminar">' +
                        '<i class="fas fa-times"></i>' +
                    '</button>' +
                '</div>';
            }
        }).join("") +
        '<span class="compose-image-count">' + this.selectedImages.length + '/' + (this.maxMedia || 4) + '</span>';
    },

    removeImage(index) {
        if (index < 0 || index >= this.selectedImages.length) return;

        // Revoke URL to free memory
        URL.revokeObjectURL(this.selectedImages[index].previewUrl);

        // Remove from array
        this.selectedImages.splice(index, 1);

        this.renderImagePreviews();
        this.updateImageButton();

},

    clearAllImages() {
        this.selectedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
        this.selectedImages = [];
        this.renderImagePreviews();
        this.updateImageButton();
    },

    updateImageButton() {
        const imageBtn = document.getElementById("composeMediaBtn");
        if (imageBtn) {
            if (this.selectedImages.length > 0) {
                imageBtn.classList.add("active");
            } else {
                imageBtn.classList.remove("active");
            }
        }
    },

    showUploadProgress(show, percent) {
        let bar = document.getElementById("composeUploadProgress");
        if (!bar && show) {
            bar = document.createElement("div");
            bar.id = "composeUploadProgress";
            bar.className = "upload-progress-bar";
            bar.innerHTML = '<div class="upload-progress-fill"></div><span class="upload-progress-text">0%</span>';
            const preview = document.getElementById("composeImagesPreview");
            if (preview && preview.parentElement) {
                preview.parentElement.insertBefore(bar, preview.nextSibling);
            }
        }
        if (bar) {
            if (show) {
                bar.style.display = "block";
                const fill = bar.querySelector(".upload-progress-fill");
                const text = bar.querySelector(".upload-progress-text");
                if (fill) fill.style.width = Math.min(percent, 100) + "%";
                if (text) text.textContent = Math.round(percent) + "%";
            } else {
                bar.style.display = "none";
            }
        }
    },

    uploadFileWithProgress(formData, endpoint, token, fileIndex, totalFiles) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", endpoint);
            xhr.setRequestHeader("Authorization", "Bearer " + token);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const filePercent = (e.loaded / e.total) * 100;
                    const overall = ((fileIndex / totalFiles) * 100) + (filePercent / totalFiles);
                    this.showUploadProgress(true, overall);
                }
            };

            xhr.onload = () => {
                try {
                    const result = JSON.parse(xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300 && result.success && result.data && result.data.url) {
                        resolve(result);
                    } else {
                        reject(new Error(result.message || result.error || "Error al subir archivo"));
                    }
                } catch (e) {
                    reject(new Error("Respuesta invalida del servidor"));
                }
            };

            xhr.onerror = () => reject(new Error("Error de red al subir archivo"));
            xhr.ontimeout = () => reject(new Error("Tiempo de espera agotado"));
            xhr.timeout = 120000;

            xhr.send(formData);
        });
    },

    async uploadImages() {
        if (this.selectedImages.length === 0) return [];

        const token = localStorage.getItem("auth_token") || localStorage.getItem("authToken") || "";
        if (!token) throw new Error("Debes iniciar sesion para subir archivos");

        const uploadedMedia = [];
        const total = this.selectedImages.length;

        this.showUploadProgress(true, 0);

        for (let i = 0; i < total; i++) {
            const media = this.selectedImages[i];
            const isVideo = media.type === "video" || (media.file && media.file.type.startsWith("video/"));
            const formData = new FormData();
            formData.append(isVideo ? "video" : "image", media.file);

            const endpoint = isVideo ? "/api/upload/social-video" : "/api/upload/social-image";

            const result = await this.uploadFileWithProgress(formData, endpoint, token, i, total);

            uploadedMedia.push({
                url: result.data.url,
                type: isVideo ? "video" : "image"
            });
        }

        this.showUploadProgress(true, 100);

        return uploadedMedia;
    },

    async handleCompose() {
        const input = document.getElementById("composeInput");
        const submitBtn = document.getElementById("composeSubmit");
        const text = input ? input.value.trim() : "";
        const pollData = this.getPollData();

        if (!text && this.selectedImages.length === 0 && !this.selectedGif && !pollData) {
            window.LaTandaPopup && window.LaTandaPopup.showWarning("Escribe algo o selecciona una imagen");
            return;
        }

        if (pollData && pollData.options.length < 2) {
            window.LaTandaPopup && window.LaTandaPopup.showWarning("La encuesta necesita al menos 2 opciones");
            return;
        }

        if (text.length > 500) {
            window.LaTandaPopup && window.LaTandaPopup.showWarning("El texto no puede exceder 500 caracteres");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        try {
            const token = localStorage.getItem("auth_token") || localStorage.getItem("authToken") || "";
            if (!token) {
                window.LaTandaPopup && window.LaTandaPopup.showError("Debes iniciar sesion para publicar");
                return;
            }

            let uploadedMedia = [];
            if (this.selectedImages.length > 0) {
                try {
                    uploadedMedia = await this.uploadImages();
                } catch (uploadError) {
                    this.showUploadProgress(false, 0);
                    window.LaTandaPopup && window.LaTandaPopup.showError("Error al subir archivos. Intenta de nuevo.");
                    return;
                }
            }

            // Build media_url value - supports mixed images/videos and GIFs
            let imageUrlValue = null;
            if (this.selectedGif) {
                imageUrlValue = this.selectedGif;
            } else if (uploadedMedia.length > 0) {
                const mediaArray = uploadedMedia.map(m => typeof m === "string" ? m : m.url);
                imageUrlValue = mediaArray.length === 1 ? mediaArray[0] : JSON.stringify(mediaArray);
            }

            const postBody = {
                content: text || (pollData ? "Encuesta" : "(imagen)"),
                image_url: imageUrlValue
            };

            if (pollData) {
                postBody.poll = pollData;
            }

            if (this.selectedGif) {
                postBody.media_type = "gif";
            } else if (uploadedMedia.some(m => (typeof m === "object" && m.type === "video"))) {
                postBody.media_type = "video";
            }

            if (this.selectedLocation) {
                postBody.location = this.selectedLocation;
            }

            if (this.incognitoMode) {
                postBody.is_anonymous = true;
            }

            if (this._linkPreviewData) {
                postBody.link_preview = this._linkPreviewData;
            }

            const response = await fetch("/api/feed/social", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(postBody)
            });

            const result = await response.json();

            if (result.success) {
                this.showUploadProgress(false, 0);
                input.value = "";
                this.clearAllImages();
                this.clearLinkPreview();
                this.selectedGif = null;
                this.selectedLocation = null;
                this.incognitoMode = false;
                const locationInput = document.getElementById("locationInput");
                if (locationInput) locationInput.value = "";
                const locationBtn = document.getElementById("composeLocationBtn");
                if (locationBtn) locationBtn.classList.remove("active");
                const incognitoBtn = document.getElementById("composeIncognitoBtn");
                if (incognitoBtn) incognitoBtn.classList.remove("active");
                const incognitoBar = document.getElementById("composeIncognitoBar");
                if (incognitoBar) incognitoBar.style.display = "none";
                this.closePollPanel();
                this.closeEmojiPanel();
                this.closeGifPanel();
                this.closeLocationPanel();
                // Reset poll inputs
                const pollList = document.getElementById("pollOptionsList");
                if (pollList) {
                    pollList.innerHTML =
                        '<input class="poll-option-input" type="text" placeholder="Opcion 1" maxlength="80">' +
                        '<input class="poll-option-input" type="text" placeholder="Opcion 2" maxlength="80">';
                }
                const addBtn = document.getElementById("pollAddOption");
                if (addBtn) addBtn.style.display = "";
                this.events.unshift(result.data.post);
                this.renderEvents();
                window.LaTandaPopup && window.LaTandaPopup.showSuccess("Publicacion creada!");
} else {
                throw new Error(result.message || result.error || "Error al publicar");
            }
        } catch (error) {
            window.LaTandaPopup && window.LaTandaPopup.showError("Error al publicar. Intenta de nuevo.");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = "Publicar";
            }
        }
    },

    attachTabHandlers() {
        const tabsContainer = document.getElementById("feedTabs");
        if (!tabsContainer) return;

        tabsContainer.addEventListener("click", (e) => {
            const tab = e.target.closest(".feed-tab");
            if (!tab) return;

            const tabId = tab.dataset.tab;
            if (tabId === this.currentTab) return;

            tabsContainer.querySelectorAll(".feed-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            this.currentTab = tabId;
            this.loadEvents(true);
        });
    },

    attachPostMenuHandlers() {
        if (!this.container) return;

        // Close any open menus when clicking outside
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".post-menu-container")) {
                document.querySelectorAll(".post-menu-dropdown.show").forEach(menu => {
                    menu.classList.remove("show");
                });
            }
        });

        // Delegate clicks for menu buttons
        this.container.addEventListener("click", (e) => {
            const menuBtn = e.target.closest(".post-menu-btn");;
            if (menuBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.togglePostMenu(menuBtn);
                return;
            }

            const editBtn = e.target.closest(".post-menu-edit");
            if (editBtn) {
                e.preventDefault();
                const eventId = editBtn.dataset.id;
                this.openEditModal(eventId);
                return;
            }

            const deleteBtn = e.target.closest(".post-menu-delete");
            if (deleteBtn) {
                e.preventDefault();
                const eventId = deleteBtn.dataset.id;
                this.confirmDelete(eventId);
                return;
            }
        });
    },

    togglePostMenu(btn) {
        const dropdown = btn.nextElementSibling;
        if (!dropdown) return;

        // Close all other menus
        document.querySelectorAll(".post-menu-dropdown.show").forEach(menu => {
            if (menu !== dropdown) menu.classList.remove("show");
        });

        dropdown.classList.toggle("show");
    },

    confirmDelete(eventId) {
        // Close any open menu
        document.querySelectorAll(".post-menu-dropdown.show").forEach(menu => {
            menu.classList.remove("show");
        });

        if (window.LaTandaPopup && window.LaTandaPopup.showConfirm) {
            window.LaTandaPopup.showConfirm(
                "¿Eliminar publicacion? Esta accion no se puede deshacer.",
                () => this.deletePost(eventId)
            );
        } else if (confirm("¿Eliminar esta publicacion? Esta accion no se puede deshacer.")) {
            this.deletePost(eventId);
        }
    },

    async deletePost(eventId) {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("authToken") || "";
        if (!token) {
            window.LaTandaPopup && window.LaTandaPopup.showError("Debes iniciar sesion");
            return;
        }

        try {
            const response = await fetch("/api/feed/social/" + eventId, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + token }
            });

            const result = await response.json();

            if (result.success) {
                // Remove from local events array
                this.events = this.events.filter(e => String(e.id) !== eventId);
                this.renderEvents();
                window.LaTandaPopup && window.LaTandaPopup.showSuccess("Publicacion eliminada");
} else {
                throw new Error(result.message || result.error || "Error al eliminar");
            }
        } catch (error) {
            window.LaTandaPopup && window.LaTandaPopup.showError("Error al eliminar. Intenta de nuevo.");
        }
    },

    openEditModal(eventId) {
        // Close any open menu
        document.querySelectorAll(".post-menu-dropdown.show").forEach(menu => {
            menu.classList.remove("show");
        });

        const event = this.events.find(e => String(e.id) === eventId);
        if (!event) return;

        const modal = document.getElementById("postEditModal");
        const textarea = document.getElementById("postEditTextarea");
        const charCount = document.getElementById("postEditCharCount");

        if (!modal || !textarea) return;

        // Store the event ID being edited
        modal.dataset.eventId = eventId;

        // Populate with current content
        const content = event.description || event.title || "";
        textarea.value = content;
        charCount.textContent = content.length;

        // Show modal
        modal.style.display = "flex";
        textarea.focus();

},

    closeEditModal() {
        const modal = document.getElementById("postEditModal");
        if (modal) {
            modal.style.display = "none";
            modal.dataset.eventId = "";
        }
    },

    async saveEdit() {
        const modal = document.getElementById("postEditModal");
        const textarea = document.getElementById("postEditTextarea");
        const saveBtn = document.getElementById("postEditSave");

        if (!modal || !textarea) return;

        const eventId = modal.dataset.eventId;
        const content = textarea.value.trim();

        if (!eventId) return;

        if (!content) {
            window.LaTandaPopup && window.LaTandaPopup.showWarning("El contenido no puede estar vacio");
            return;
        }

        if (content.length > 500) {
            window.LaTandaPopup && window.LaTandaPopup.showWarning("El texto no puede exceder 500 caracteres");
            return;
        }

        const token = localStorage.getItem("auth_token") || localStorage.getItem("authToken") || "";
        if (!token) {
            window.LaTandaPopup && window.LaTandaPopup.showError("Debes iniciar sesion");
            return;
        }

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        try {
            const response = await fetch("/api/feed/social/" + eventId, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ content: content })
            });

            const result = await response.json();

            if (result.success) {
                // Update local events array
                const index = this.events.findIndex(e => String(e.id) === eventId);
                if (index !== -1) {
                    this.events[index].title = content.substring(0, 100); this.events[index].description = content;
                }
                this.renderEvents();
                this.closeEditModal();
                window.LaTandaPopup && window.LaTandaPopup.showSuccess("Publicacion actualizada");
} else {
                throw new Error(result.message || result.error || "Error al actualizar");
            }
        } catch (error) {
            window.LaTandaPopup && window.LaTandaPopup.showError("Error al actualizar. Intenta de nuevo.");
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = "Guardar";
            }
        }
    },

    async loadEvents(reset = false) {
        if (this.isLoading) return;
        if (!this.hasMore && !reset) return;

        if (reset) {
            this.events = [];
            this.offset = 0;
            this.hasMore = true;
        }

        this.isLoading = true;
        this.showLoadingIndicator();

        try {
            const token = localStorage.getItem("auth_token") || localStorage.getItem("authToken") || "";
            const tab = this.tabs.find(t => t.id === this.currentTab);

            let url;
            if (tab.filter === "trending") {
                url = "/api/feed/social/trending?limit=" + this.limit + "&offset=" + this.offset;
            } else if (tab.filter) {
                url = "/api/feed/social?limit=" + this.limit + "&offset=" + this.offset + "&types=" + tab.filter;
            } else {
                url = "/api/feed/social?limit=" + this.limit + "&offset=" + this.offset;
            }

            // Add hashtag filter if active
            if (this.currentHashtag) {
                url += (url.includes('?') ? '&' : '?') + 'hashtag=' + encodeURIComponent(this.currentHashtag);
            }
            // Add search filter if active
            if (this.currentSearch) {
                url += (url.includes('?') ? '&' : '?') + 'search=' + encodeURIComponent(this.currentSearch);
            }
            const response = await fetch(url, {
                headers: token ? { "Authorization": "Bearer " + token } : {}
            });

            if (!response.ok) throw new Error("HTTP " + response.status);
            const result = await response.json();

            if (result.success && result.data) {
                const newEvents = result.data.events || [];
                this.events = [...this.events, ...newEvents];
                this.hasMore = result.data.pagination ? result.data.pagination.has_more : false;
                this.offset += newEvents.length;
                this.renderEvents();
            } else {
                this.renderError();
            }
        } catch (error) {
            this.renderError();
        } finally {
            this.isLoading = false;
        }
    },

    renderEvents() {
        const listEl = document.getElementById("socialFeedList");
        if (!listEl) return;

        if (this.events.length === 0) {
            const tab = this.tabs.find(t => t.id === this.currentTab);
            listEl.innerHTML =
                '<div class="social-feed-empty">' +
                    '<i class="fas ' + (tab ? tab.icon : 'fa-inbox') + '"></i>' +
                    '<p>No hay actividad ' + (this.currentTab !== "todos" ? "en esta categoria" : "reciente") + '</p>' +
                    '<span>La actividad de la comunidad aparecera aqui</span>' +
                '</div>';
            return;
        }

        listEl.innerHTML = this.events.map(event => this.renderEventCard(event)).join("");

        // Observe feed videos for auto-pause on scroll
        if (this.videoVisibilityObserver) {
            listEl.querySelectorAll(".media-video-wrapper video").forEach(v => {
                this.videoVisibilityObserver.observe(v);
            });
        }

        // Observe cards for view tracking
        if (this.viewObserver) {
            listEl.querySelectorAll(".social-card").forEach(card => {
                this.viewObserver.observe(card);
            });
        }

        // Deep link: scroll to shared event if ?event= param is present
        if (this.deepLinkEventId) {
            const targetCard = listEl.querySelector('.social-card[data-event-id="' + this.deepLinkEventId + '"]');
            if (targetCard) {
                setTimeout(() => {
                    targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
                    targetCard.classList.add("highlight-shared");
                    setTimeout(() => targetCard.classList.remove("highlight-shared"), 3000);
                }, 300);
                this.deepLinkEventId = null;
            }
        }

        // Pre-fill compose with shared content from other apps
        if (this._pendingShare) {
            setTimeout(() => {
                const input = document.getElementById("composeInput");
                if (input) {
                    input.value = this._pendingShare;
                    input.style.height = "auto";
                    input.style.height = Math.min(input.scrollHeight, 300) + "px";
                    input.focus();
                    input.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                this._pendingShare = null;
            }, 500);
        }
    },

    renderEventCard(event) {
        const config = this.eventTypes[event.event_type] || this.defaultConfig;
        const meta = event.metadata || {};
        const isAnonymous = meta.is_anonymous === true;
        const actor = isAnonymous ? { name: 'Anonimo', initials: '??', avatar_url: null, id: null } : (event.actor || {});
        const engagement = event.engagement || {};

        const hasImage = actor.avatar_url ? "has-image" : "initials";
        const avatarContent = actor.avatar_url
            ? '<img src="' + this.escapeHtml(actor.avatar_url) + '" alt="' + this.escapeHtml(actor.name) + '" class="avatar-fallback-img">'
            : '<span style="color: ' + (isAnonymous ? '#8b5cf6' : config.color) + '">' + this.escapeHtml(actor.initials || '??') + '</span>';
        const verifiedBadge = isAnonymous ? '' : (actor.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : '');
        const likesText = engagement.likes || '';
        const commentsText = engagement.comments || '';
        const viewCount = engagement.views || 0;

        const trendingBadge = this.currentTab === "trending" && engagement.score > 5
            ? '<span class="trending-badge"><i class="fas fa-fire"></i></span>'
            : '';

        // Handle multiple images
        const imageHtml = this.renderImageGrid(event.image_url);

        // Anonymous posts: show icon next to name
        const anonBadge = isAnonymous ? ' <i class="fas fa-user-secret" style="color: #8b5cf6; font-size: 0.75rem;" title="Publicacion anonima"></i>' : '';

        // Location from metadata
        const locationBadge = meta.location
            ? '<span class="post-location-badge"><i class="fas fa-map-marker-alt"></i> ' + this.escapeHtml(meta.location) + '</span>'
            : '';

        // Check if this is user's own post (show menu for user_post type only)
        const realActorId = isAnonymous ? (meta.real_actor_id || null) : actor.id;
        const isOwnPost = event.event_type === "user_post" && realActorId && this.currentUserId && String(realActorId) === String(this.currentUserId);
        const menuHtml = isOwnPost
            ? '<div class="post-menu-container">' +
                  '<button class="post-menu-btn" title="Opciones"><i class="fas fa-ellipsis-h"></i></button>' +
                  '<div class="post-menu-dropdown">' +
                      '<button class="post-menu-edit" data-id="' + this.escapeHtml(String(event.id)) + '"><i class="fas fa-edit"></i> Editar</button>' +
                      '<button class="post-menu-delete" data-id="' + this.escapeHtml(String(event.id)) + '"><i class="fas fa-trash-alt"></i> Eliminar</button>' +
                  '</div>' +
              '</div>'
            : '';

        const avatarColor = isAnonymous ? '#8b5cf620' : (config.color + '20');

        return '<div class="social-card' + (isAnonymous ? ' anonymous-post' : '') + '" data-event-id="' + this.escapeHtml(String(event.id)) + '" data-type="' + this.escapeHtml(event.event_type || '') + '">' +
            '<div class="social-card-header">' +
                '<div class="actor-avatar ' + hasImage + '" style="background: ' + avatarColor + '"' + (isAnonymous ? '' : ' data-user-id="' + this.escapeHtml(String(actor.id || '')) + '" role="button" tabindex="0"') + '>' +
                    avatarContent +
                    verifiedBadge +
                '</div>' +
                '<div class="actor-info">' +
                    '<span class="actor-name">' + this.escapeHtml(actor.name || 'Usuario') + anonBadge + ' ' + trendingBadge + '</span>' +
                    '<span class="event-type-label" style="color: ' + config.color + '">' +
                        '<i class="fas ' + config.icon + '"></i> ' + config.label +
                        locationBadge +
                    '</span>' +
                '</div>' +
                '<span class="event-time">' + this.escapeHtml(event.time_ago || '') + '</span>' +
                menuHtml +
            '</div>' +
            '<div class="social-card-body">' +
                // For user_post, only show description (full text), not title (truncated)
                (event.event_type === 'user_post' ? '' : '<p class="event-title">' + this.parseContent(event.title) + '</p>') +
                (event.description ? '<p class="event-desc">' + this.parseContent(event.description) + '</p>' : '') +
                imageHtml +
                this.renderPollDisplay(event) +
                this.renderMetadata(event) +
                this.renderLinkPreviewCard(event) +
            '</div>' +
            '<div class="social-card-footer">' +
                (viewCount > 0 ? '<span class="sf-views"><i class="far fa-eye"></i> ' + viewCount + '</span>' : '') +
                '<button class="engagement-btn like-btn' + (event.is_liked ? ' liked' : '') + '" data-id="' + this.escapeHtml(String(event.id)) + '" title="Me gusta">' +
                    '<i class="' + (event.is_liked ? 'fas' : 'far') + ' fa-heart"></i>' +
                    '<span>' + likesText + '</span>' +
                '</button>' +
                '<button class="engagement-btn comment-btn" data-id="' + this.escapeHtml(String(event.id)) + '" title="Comentar">' +
                    '<i class="far fa-comment"></i>' +
                    '<span>' + commentsText + '</span>' +
                '</button>' +
                '<button class="engagement-btn share-btn" data-id="' + this.escapeHtml(String(event.id)) + '" title="Compartir">' +
                    '<i class="fas fa-share-alt"></i>' +
                '</button>' +
                '<button class="engagement-btn bookmark-btn' + (event.is_bookmarked ? ' bookmarked' : '') + '" data-id="' + this.escapeHtml(String(event.id)) + '" title="Guardar">' +
                    '<i class="' + (event.is_bookmarked ? 'fas' : 'far') + ' fa-bookmark"></i>' +
                '</button>' +
            '</div>' +
        '</div>';
    },

    isVideoUrl(url) {
        if (!url) return false;
        const videoExts = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
        const lower = url.toLowerCase().split('?')[0];
        return videoExts.some(ext => lower.endsWith(ext));
    },

    renderImageGrid(imageUrl) {
        if (!imageUrl) return '';

        // Try to parse as JSON array
        let mediaItems = [];
        if (imageUrl.startsWith('[')) {
            try {
                mediaItems = JSON.parse(imageUrl);
            } catch (e) {
                mediaItems = [imageUrl];
            }
        } else {
            mediaItems = [imageUrl];
        }

        if (mediaItems.length === 0) return '';

        const gridClass = 'event-media-grid grid-' + Math.min(mediaItems.length, 4);

        let imgIndex = 0;
        const mediaHtml = mediaItems.slice(0, 4).map(url => {
            if (this.isVideoUrl(url)) {
                return '<div class="media-video-wrapper">' +
                    '<video src="' + this.escapeHtml(url) + '" controls playsinline preload="auto"></video>' +
                    '<div class="video-play-overlay"><i class="fas fa-play-circle"></i></div>' +
                '</div>';
            }
            const isGif = url.includes('klipy') || url.includes('/gifs/') || (url.toLowerCase().endsWith('.gif'));
            const idx = imgIndex++;
            return '<img src="' + this.escapeHtml(url) + '" alt="" loading="lazy" class="lightbox-trigger' + (isGif ? ' gif-media' : '') + '" data-lightbox-index="' + idx + '">';
        }).join('');

        return '<div class="' + gridClass + '">' + mediaHtml + '</div>';
    },

    renderMetadata(event) {
        const meta = event.metadata || {};
        const parts = [];

        if (meta.price) {
            parts.push('<span class="meta-price">L. ' + Number(meta.price).toLocaleString("es-HN") + '</span>');
        }
        if (meta.location) {
            parts.push('<span class="meta-location"><i class="fas fa-map-marker-alt"></i> ' + this.escapeHtml(meta.location) + '</span>');
        }
        if (meta.members) {
            parts.push('<span class="meta-members"><i class="fas fa-users"></i> ' + this.escapeHtml(String(meta.members)) + ' miembros</span>');
        }

        if (parts.length === 0) return '';
        return '<div class="event-meta">' + parts.join('') + '</div>';
    },

    attachEngagementHandlers() {
        if (!this.container) return;

        this.container.addEventListener("click", async (e) => {
            const likeBtn = e.target.closest(".like-btn");
            const bookmarkBtn = e.target.closest(".bookmark-btn");
            const commentBtn = e.target.closest(".comment-btn");
            const shareBtn = e.target.closest(".share-btn");

            if (likeBtn) {
                e.preventDefault();
                await this.toggleLike(likeBtn);
            }
            if (bookmarkBtn) {
                e.preventDefault();
                await this.toggleBookmark(bookmarkBtn);
            }
            if (commentBtn) {
                e.preventDefault();
                this.openComments(commentBtn.dataset.id);
            }
            if (shareBtn) {
                e.preventDefault();
                this.shareEvent(shareBtn.dataset.id);
            }

            // Handle poll vote clicks
            const voteBtn = e.target.closest(".poll-vote-btn");
            if (voteBtn) {
                e.preventDefault();
                const eventId = voteBtn.dataset.eventId;
                const optionIndex = parseInt(voteBtn.dataset.option);
                this.handlePollVote(eventId, optionIndex);
                return;
            }

            // Handle @mention clicks
            const mentionLink = e.target.closest(".mention-link");
            if (mentionLink) {
                e.preventDefault();
                e.stopPropagation();
                const handle = mentionLink.dataset.handle;
                if (handle) {
                    this.showUserProfileByHandle(handle, mentionLink);
                }
                return;
            }

            // Handle #hashtag clicks
            const hashtagLink = e.target.closest(".hashtag-link");
            if (hashtagLink) {
                e.preventDefault();
                e.stopPropagation();
                const tag = hashtagLink.dataset.tag;
                if (tag) {
                    this.filterByHashtag(tag);
                }
                return;
            }

            // Handle image click → lightbox
            const clickedImg = e.target.closest("img.lightbox-trigger");
            if (clickedImg) {
                e.preventDefault();
                e.stopPropagation();
                const card = clickedImg.closest(".social-card");
                const eventId = card ? card.dataset.eventId : null;
                const event = eventId ? this.events.find(ev => ev.id === eventId) : null;
                if (event && event.image_url) {
                    let urls = [];
                    if (event.image_url.startsWith("[")) {
                        try { urls = JSON.parse(event.image_url); } catch(e) { urls = [event.image_url]; }
                    } else {
                        urls = [event.image_url];
                    }
                    const index = parseInt(clickedImg.dataset.lightboxIndex) || 0;
                    if (urls.length > 0) this.openLightbox(urls, index);
                }
                return;
            }
        });
    },

    async toggleLike(button) {
        if (button.disabled) return;
        button.disabled = true;
        const eventId = button.dataset.id;
        const token = localStorage.getItem("auth_token") || localStorage.getItem("authToken");

        if (!token) {
            window.LaTandaPopup && window.LaTandaPopup.showError("Inicia sesion para dar like");
            button.disabled = false;
            return;
        }

        const wasLiked = button.classList.contains("liked");
        button.classList.toggle("liked");
        const icon = button.querySelector("i");
        icon.classList.toggle("far", wasLiked);
        icon.classList.toggle("fas", !wasLiked);

        const countSpan = button.querySelector("span");
        const count = parseInt(countSpan.textContent) || 0;
        countSpan.textContent = wasLiked ? (Math.max(0, count - 1) || '') : count + 1;

        if (!wasLiked) {
            button.animate([
                { transform: "scale(1)" },
                { transform: "scale(1.3)" },
                { transform: "scale(1)" }
            ], { duration: 200 });
        }

        try {
            const response = await fetch("/api/feed/social/" + eventId + "/like", {
                method: "POST",
                headers: { "Authorization": "Bearer " + token }
            });

            if (!response.ok) {
                button.classList.toggle("liked");
                icon.classList.toggle("far");
                icon.classList.toggle("fas");
                countSpan.textContent = count || '';
            }
        } catch (error) {
            button.classList.toggle("liked");
            icon.classList.toggle("far");
            icon.classList.toggle("fas");
            countSpan.textContent = count || '';
        } finally {
            button.disabled = false;
        }
    },

    async toggleBookmark(button) {
        if (button.disabled) return;
        button.disabled = true;
        const eventId = button.dataset.id;
        const token = localStorage.getItem("auth_token") || localStorage.getItem("authToken");

        if (!token) {
            window.LaTandaPopup && window.LaTandaPopup.showError("Inicia sesion para guardar");
            button.disabled = false;
            return;
        }

        const wasBookmarked = button.classList.contains("bookmarked");
        button.classList.toggle("bookmarked");
        const icon = button.querySelector("i");
        icon.classList.toggle("far", wasBookmarked);
        icon.classList.toggle("fas", !wasBookmarked);

        if (!wasBookmarked) {
            button.animate([
                { transform: "scale(1)" },
                { transform: "scale(1.2)" },
                { transform: "scale(1)" }
            ], { duration: 200 });
        }

        try {
            const response = await fetch("/api/feed/social/" + eventId + "/bookmark", {
                method: "POST",
                headers: { "Authorization": "Bearer " + token }
            });

            if (!response.ok) {
                button.classList.toggle("bookmarked");
                icon.classList.toggle("far");
                icon.classList.toggle("fas");
            }
        } catch (error) {
            button.classList.toggle("bookmarked");
            icon.classList.toggle("far");
            icon.classList.toggle("fas");
        } finally {
            button.disabled = false;
        }
    },

    openComments(eventId) {
if (window.CommentsModal) {
            window.CommentsModal.open(eventId);
        } else {
            window.LaTandaPopup && window.LaTandaPopup.showInfo("Comentarios proximamente");
        }
    },

    shareEvent(eventId) {
        const event = this.events.find(e => String(e.id) === eventId);
        if (!event) return;

        const shareUrl = window.location.origin + "/home-dashboard.html?event=" + eventId;
        const shareText = event.title;

        if (navigator.share) {
            navigator.share({
                title: "La Tanda",
                text: shareText,
                url: shareUrl
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                window.LaTandaPopup && window.LaTandaPopup.showSuccess("Link copiado al portapapeles");
            });
        }
    },

    showLoadingIndicator() {
        const listEl = document.getElementById("socialFeedList");
        if (!listEl) return;

        if (this.events.length > 0) {
            const existingSpinner = listEl.querySelector(".social-feed-load-more");
            if (!existingSpinner) {
                listEl.insertAdjacentHTML("beforeend",
                    '<div class="social-feed-load-more">' +
                        '<i class="fas fa-spinner fa-spin"></i>' +
                    '</div>'
                );
            }
        }
    },

    hideLoadingIndicator() {
        const spinner = document.querySelector(".social-feed-load-more");
        if (spinner) spinner.remove();
    },

    renderError() {
        const listEl = document.getElementById("socialFeedList");
        if (!listEl) return;

        listEl.innerHTML =
            '<div class="social-feed-error">' +
                '<i class="fas fa-exclamation-triangle"></i>' +
                '<p>Error al cargar el feed</p>' +
                '<button class="btn-retry" data-action="retry-feed">' +
                    '<i class="fas fa-redo"></i> Reintentar' +
                '</button>' +
            '</div>';
        const retryBtn = listEl.querySelector('[data-action="retry-feed"]');
        if (retryBtn) retryBtn.addEventListener("click", () => this.loadEvents(true));
    },

    setupIntersectionObserver() {
        const sentinel = document.getElementById("socialFeedSentinel");
        if (!sentinel) return;

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMore && !this.isLoading) {
                    this.loadEvents();
                }
            });
        }, {
            root: null,
            rootMargin: "200px",
            threshold: 0
        });

        this.observer.observe(sentinel);
    },


    // ========================================
    // @Mention Autocomplete - Added 2026-02-03

    // ========================================
    // Auto-resize textarea as user types
    // ========================================
    setupAutoResize() {
        const textarea = document.getElementById("composeInput");
        if (!textarea) return;

        const autoResize = () => {
            textarea.style.height = "auto";
            textarea.style.height = Math.min(textarea.scrollHeight, 300) + "px";
        };

        textarea.addEventListener("input", autoResize);
        textarea.addEventListener("focus", autoResize);
        
        // Initial resize
        autoResize();
    },


    // ========================================
    // Link Preview - detect URLs in compose, show OG preview card
    // ========================================
    setupLinkPreview() {
        const input = document.getElementById("composeInput");
        if (!input) return;

        this._linkPreviewData = null;
        this._linkPreviewUrl = null;
        this._linkPreviewTimer = null;

        input.addEventListener("input", () => {
            clearTimeout(this._linkPreviewTimer);
            this._linkPreviewTimer = setTimeout(() => this.detectAndFetchLink(), 800);
        });

        input.addEventListener("paste", () => {
            setTimeout(() => this.detectAndFetchLink(), 100);
        });
    },

    detectAndFetchLink() {
        const input = document.getElementById("composeInput");
        if (!input) return;

        const text = input.value;
        const urlMatch = text.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/i);

        if (!urlMatch) {
            this.clearLinkPreview();
            return;
        }

        const url = urlMatch[0];
        if (url === this._linkPreviewUrl) return;

        this._linkPreviewUrl = url;
        this.fetchLinkPreview(url);
    },

    async fetchLinkPreview(url) {
        const container = document.getElementById("composeLinkPreview");
        if (!container) return;

        container.style.display = "block";
        container.innerHTML = '<div class="link-preview-loading"><i class="fas fa-spinner fa-spin"></i> Cargando vista previa...</div>';

        try {
            const token = localStorage.getItem("auth_token") || localStorage.getItem("authToken") || "";
            const res = await fetch("/api/link-preview?url=" + encodeURIComponent(url), {
                headers: token ? { "Authorization": "Bearer " + token } : {}
            });
            const result = await res.json();

            if (result.success && result.data && this._linkPreviewUrl === url) {
                this._linkPreviewData = result.data;
                this.renderComposeLinkPreview(result.data);
            } else {
                this.clearLinkPreview();
            }
        } catch (e) {
            this.clearLinkPreview();
        }
    },

    renderComposeLinkPreview(data) {
        const container = document.getElementById("composeLinkPreview");
        if (!container) return;

        const imgHtml = data.image
            ? '<div class="link-preview-image"><img src="' + this.escapeHtml(data.image) + '" alt="" loading="lazy"></div>'
            : '';

        const title = data.title || data.domain;
        const desc = data.description
            ? '<p class="link-preview-desc">' + this.escapeHtml(data.description.length > 120 ? data.description.substring(0, 120) + '...' : data.description) + '</p>'
            : '';

        container.style.display = "block";
        container.innerHTML =
            '<div class="link-preview-card">' +
                '<button class="link-preview-remove" title="Quitar"><i class="fas fa-times"></i></button>' +
                imgHtml +
                '<div class="link-preview-info">' +
                    '<span class="link-preview-domain"><i class="fas fa-link"></i> ' + this.escapeHtml(data.domain) + '</span>' +
                    '<span class="link-preview-title">' + this.escapeHtml(title) + '</span>' +
                    desc +
                '</div>' +
            '</div>';

        container.querySelector(".link-preview-remove").addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.clearLinkPreview();
        });
    },

    clearLinkPreview() {
        this._linkPreviewData = null;
        this._linkPreviewUrl = null;
        const container = document.getElementById("composeLinkPreview");
        if (container) {
            container.style.display = "none";
            container.innerHTML = "";
        }
    },

    getEmbedHtml(url) {
        if (!url) return null;
        // YouTube
        let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
        if (m) return '<div class="embed-container"><iframe src="https://www.youtube.com/embed/' + m[1] + '?rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
        // Vimeo
        m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        if (m) return '<div class="embed-container"><iframe src="https://player.vimeo.com/video/' + m[1] + '" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
        // Spotify
        m = url.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
        if (m) return '<div class="embed-container embed-spotify"><iframe src="https://open.spotify.com/embed/' + m[1] + '/' + m[2] + '?theme=0" frameborder="0" allow="encrypted-media" allowfullscreen loading="lazy"></iframe></div>';
        // TikTok
        m = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
        if (m) return '<div class="embed-container embed-tiktok"><iframe src="https://www.tiktok.com/embed/v2/' + m[1] + '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope" allowfullscreen loading="lazy"></iframe></div>';
        return null;
    },

    renderLinkPreviewCard(event) {
        const meta = event.metadata || {};
        const lp = meta.link_preview;

        // Try to get URL from link_preview metadata or from post text
        let url = lp ? lp.url : null;
        if (!url && event.description) {
            const urlMatch = event.description.match(/https?:\/\/[^\s<>"]+/i);
            if (urlMatch) url = urlMatch[0];
        }
        if (!url) return '';

        // Check for embeddable content first
        const embedHtml = this.getEmbedHtml(url);
        if (embedHtml) return embedHtml;

        // Fall back to OG link preview card (only if we have link_preview metadata)
        if (!lp) return '';

        const imgHtml = lp.image
            ? '<div class="feed-link-preview-image"><img src="' + this.escapeHtml(lp.image) + '" alt="" loading="lazy"></div>'
            : '';

        const title = lp.title || lp.domain || '';
        const desc = lp.description
            ? '<p class="feed-link-preview-desc">' + this.escapeHtml(lp.description.length > 150 ? lp.description.substring(0, 150) + '...' : lp.description) + '</p>'
            : '';

        return '<a href="' + this.escapeHtml(lp.url) + '" target="_blank" rel="noopener noreferrer" class="feed-link-preview-card">' +
                imgHtml +
                '<div class="feed-link-preview-info">' +
                    '<span class="feed-link-preview-domain"><i class="fas fa-link"></i> ' + this.escapeHtml(lp.domain || lp.site_name || '') + '</span>' +
                    '<span class="feed-link-preview-title">' + this.escapeHtml(title) + '</span>' +
                    desc +
                '</div>' +
            '</a>';
    },

    // ========================================
    setupMentionAutocomplete() {
        const input = document.getElementById("composeInput");
        if (!input) return;

        // Create autocomplete dropdown
        const dropdown = document.createElement("div");
        dropdown.id = "mentionAutocomplete";
        dropdown.className = "mention-autocomplete";
        dropdown.style.display = "none";
        input.parentElement.appendChild(dropdown);

        this.mentionState = {
            active: false,
            startPos: 0,
            query: "",
            selectedIndex: 0,
            users: []
        };

        // Listen for input
        input.addEventListener("input", (e) => this.handleMentionInput(e));
        input.addEventListener("keydown", (e) => this.handleMentionKeydown(e));
        input.addEventListener("blur", () => {
            setTimeout(() => this.hideMentionDropdown(), 200);
        });

        // Click on dropdown item
        dropdown.addEventListener("click", (e) => {
            const item = e.target.closest(".mention-item");
            if (item) {
                const handle = item.dataset.handle;
                this.insertMention(handle);
            }
        });
    },

    handleMentionInput(e) {
        const input = e.target;
        const text = input.value;
        const cursorPos = input.selectionStart;

        // Find @ before cursor
        const textBeforeCursor = text.substring(0, cursorPos);
        const atMatch = textBeforeCursor.match(/@([\w\-\.]*)$/);

        if (atMatch) {
            this.mentionState.active = true;
            this.mentionState.startPos = cursorPos - atMatch[0].length;
            this.mentionState.query = atMatch[1];
            this.mentionState.selectedIndex = 0;
            this.searchMentions(atMatch[1]);
        } else {
            this.hideMentionDropdown();
        }
    },

    handleMentionKeydown(e) {
        if (!this.mentionState.active) return;

        const dropdown = document.getElementById("mentionAutocomplete");
        const items = dropdown.querySelectorAll(".mention-item");

        switch(e.key) {
            case "ArrowDown":
                e.preventDefault();
                this.mentionState.selectedIndex = Math.min(
                    this.mentionState.selectedIndex + 1,
                    items.length - 1
                );
                this.updateMentionSelection();
                break;

            case "ArrowUp":
                e.preventDefault();
                this.mentionState.selectedIndex = Math.max(
                    this.mentionState.selectedIndex - 1,
                    0
                );
                this.updateMentionSelection();
                break;

            case "Enter":
            case "Tab":
                if (items.length > 0) {
                    e.preventDefault();
                    const selected = items[this.mentionState.selectedIndex];
                    if (selected) {
                        this.insertMention(selected.dataset.handle);
                    }
                }
                break;

            case "Escape":
                this.hideMentionDropdown();
                break;
        }
    },

    async searchMentions(query) {
        if (query.length < 1) {
            this.hideMentionDropdown();
            return;
        }

        clearTimeout(this.mentionDebounceTimer);
        this.mentionDebounceTimer = setTimeout(async () => {
        try {
            const response = await fetch("/api/users/search-mentions?q=" + encodeURIComponent(query) + "&limit=5");
            const result = await response.json();

            if (result.success && result.data.users.length > 0) {
                this.mentionState.users = result.data.users;
                this.showMentionDropdown(result.data.users);
            } else {
                this.hideMentionDropdown();
            }
        } catch (error) {
            this.hideMentionDropdown();
        }
        }, 200);
    },

    showMentionDropdown(users) {
        const dropdown = document.getElementById("mentionAutocomplete");
        if (!dropdown) return;

        dropdown.innerHTML = users.map((user, index) => {
            const avatarHtml = user.avatar_url
                ? '<img src="' + this.escapeHtml(user.avatar_url) + '" alt="" class="avatar-fallback-img">'
                : '<span class="mention-initials">' + (user.name || "?").substring(0, 2).toUpperCase() + '</span>';
            
            const verifiedBadge = user.verified ? '<i class="fas fa-check-circle verified-icon"></i>' : '';

            return '<div class="mention-item ' + (index === 0 ? 'selected' : '') + '" data-handle="' + this.escapeHtml(user.handle) + '">' +
                '<div class="mention-avatar">' + avatarHtml + '</div>' +
                '<div class="mention-info">' +
                    '<span class="mention-name">' + this.escapeHtml(user.name) + verifiedBadge + '</span>' +
                    '<span class="mention-handle">@' + this.escapeHtml(user.handle) + '</span>' +
                '</div>' +
            '</div>';
        }).join("");

        dropdown.style.display = "block";
    },

    hideMentionDropdown() {
        const dropdown = document.getElementById("mentionAutocomplete");
        if (dropdown) {
            dropdown.style.display = "none";
        }
        this.mentionState.active = false;
        this.mentionState.users = [];
    },

    updateMentionSelection() {
        const dropdown = document.getElementById("mentionAutocomplete");
        const items = dropdown.querySelectorAll(".mention-item");
        items.forEach((item, i) => {
            item.classList.toggle("selected", i === this.mentionState.selectedIndex);
        });
    },

    insertMention(handle) {
        const input = document.getElementById("composeInput");
        if (!input) return;

        const text = input.value;
        const before = text.substring(0, this.mentionState.startPos);
        const after = text.substring(input.selectionStart);

        input.value = before + "@" + handle + " " + after;
        input.focus();

        // Set cursor after the mention
        const newPos = this.mentionState.startPos + handle.length + 2;
        input.setSelectionRange(newPos, newPos);

        this.hideMentionDropdown();
    },

    // ========================================
    // Parse @mentions and #hashtags in text
    // Added: 2026-02-03
    // ========================================
    parseContent(text) {
        if (!text) return "";

        // First escape HTML to prevent XSS
        let escaped = this.escapeHtml(text);

        // Parse @mentions - make clickable
        escaped = escaped.replace(
            /@([\w\-\.]+)/g,
            '<a href="#" class="mention-link" data-handle="$1">@$1</a>'
        );

        // Parse #hashtags - make clickable (supports Spanish accents)
        escaped = escaped.replace(
            /#([\wáéíóúñÁÉÍÓÚÑ]+)/g,
            '<a href="#" class="hashtag-link" data-tag="$1">#$1</a>'
        );

        // Parse URLs - make clickable links
        escaped = escaped.replace(
            /(https?:\/\/[^\s<>"]+)/gi,
            '<a href="$1" target="_blank" rel="noopener noreferrer" class="post-link">$1</a>'
        );

        return escaped;
    },

    // Show user profile by handle (pinned mini profile popup)
    async showUserProfileByHandle(handle, element) {
        try {
            const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
            const response = await fetch("/api/users/by-handle/" + handle, {
                headers: token ? { 'Authorization': 'Bearer ' + token } : {}
            });
            const result = await response.json();

            if (result.success && result.data && result.data.user_id) {
                if (window.UserMiniProfile) {
                    window.UserMiniProfile.showPinned(element, String(result.data.user_id));
                }
            } else {
                window.LaTandaPopup && window.LaTandaPopup.showInfo("Usuario @" + handle + " no encontrado");
            }
        } catch (error) {
            window.LaTandaPopup && window.LaTandaPopup.showError("Error al buscar usuario");
        }
    },
    // Filter feed by hashtag
    filterByHashtag(tag) {
        // Update URL for sharing/bookmarking
        const url = new URL(window.location);
        url.searchParams.set("hashtag", tag);
        window.history.pushState({}, "", url);

        // Store current filter
        this.currentHashtag = tag;

        // Show filter bar
        this.showHashtagFilter(tag);

        // Reload feed with filter
        this.loadEvents(true);
    },

    showHashtagFilter(tag) {
        const feedWrapper = this.container.querySelector(".social-feed-wrapper");
        if (!feedWrapper) return;

        // Remove existing filter bar
        const existing = feedWrapper.querySelector(".hashtag-filter-bar");
        if (existing) existing.remove();

        const filterHTML = 
            '<div class="hashtag-filter-bar">' +
                '<span>Mostrando posts con <strong>#' + this.escapeHtml(tag) + '</strong></span>' +
                '<button class="clear-filter-btn" title="Limpiar filtro">' +
                    '<i class="fas fa-times"></i>' +
                '</button>' +
            '</div>';

        // Insert after tabs
        const tabsContainer = feedWrapper.querySelector(".feed-tabs-container");
        if (tabsContainer) {
            tabsContainer.insertAdjacentHTML("afterend", filterHTML);
        } else {
            feedWrapper.insertAdjacentHTML("afterbegin", filterHTML);
        }

        // Add click handler for clear button
        const clearBtn = feedWrapper.querySelector(".clear-filter-btn");
        if (clearBtn) {
            clearBtn.addEventListener("click", () => this.clearHashtagFilter());
        }
    },

    clearHashtagFilter() {
        this.currentHashtag = null;
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.delete("hashtag");
        window.history.pushState({}, "", url);

        // Remove filter bar
        const filterBar = this.container.querySelector(".hashtag-filter-bar");
        if (filterBar) filterBar.remove();

        // Reload feed without filter
        this.loadEvents(true);
    },

    // ========================================
    // SEARCH
    // ========================================
    setupSearch() {
        const searchInput = document.getElementById("sidebarSearch");
        if (!searchInput) return;
        let debounceTimer = null;
        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                clearTimeout(debounceTimer);
                const term = searchInput.value.trim();
                if (term.length > 0) {
                    this.filterBySearch(term);
                } else {
                    this.clearSearch();
                }
            }
        });
        searchInput.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            const term = searchInput.value.trim();
            if (term.length === 0 && this.currentSearch) {
                this.clearSearch();
            } else if (term.length >= 2) {
                debounceTimer = setTimeout(() => this.filterBySearch(term), 500);
            }
        });
    },

    filterBySearch(term) {
        this.currentSearch = term;
        this.showSearchFilter(term);
        this.loadEvents(true);
    },

    showSearchFilter(term) {
        const feedWrapper = this.container.querySelector(".social-feed-wrapper");
        if (!feedWrapper) return;

        const existing = feedWrapper.querySelector(".search-filter-bar");
        if (existing) existing.remove();

        const filterHTML =
            '<div class="search-filter-bar">' +
                '<span><i class="fas fa-search"></i> Resultados para <strong>' + this.escapeHtml(term) + '</strong></span>' +
                '<button class="clear-filter-btn" title="Limpiar busqueda">' +
                    '<i class="fas fa-times"></i>' +
                '</button>' +
            '</div>';

        const tabsContainer = feedWrapper.querySelector(".feed-tabs-container");
        if (tabsContainer) {
            tabsContainer.insertAdjacentHTML("afterend", filterHTML);
        } else {
            feedWrapper.insertAdjacentHTML("afterbegin", filterHTML);
        }

        const clearBtn = feedWrapper.querySelector(".search-filter-bar .clear-filter-btn");
        if (clearBtn) {
            clearBtn.addEventListener("click", () => this.clearSearch());
        }
    },

    clearSearch() {
        this.currentSearch = null;
        const searchInput = document.getElementById("sidebarSearch");
        if (searchInput) searchInput.value = "";

        const filterBar = this.container.querySelector(".search-filter-bar");
        if (filterBar) filterBar.remove();

        this.loadEvents(true);
    },

    escapeHtml(text) {
        if (!text) return "";
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    },

    isMobileDevice() {
        return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
    },

    async openCameraModal(mode) {
        const modal = document.getElementById("cameraModal");
        const preview = document.getElementById("cameraPreview");
        const title = document.getElementById("cameraModalTitle");
        const captureBtn = document.getElementById("cameraCaptureBtn");
        const recordBtn = document.getElementById("cameraRecordBtn");
        const timerEl = document.getElementById("cameraTimer");

        if (!modal || !preview) return;

        this.cameraMode = mode;
        this.cameraFacingMode = "user";
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recordingTimer = null;
        this.recordingSeconds = 0;

        title.textContent = mode === "photo" ? "Tomar foto" : "Grabar video";
        captureBtn.style.display = mode === "photo" ? "" : "none";
        recordBtn.style.display = mode === "video" ? "" : "none";
        timerEl.style.display = "none";

        modal.classList.add("show");

        try {
            await this.startCameraStream();
        } catch (err) {
            window.LaTandaPopup && window.LaTandaPopup.showError("No se pudo acceder a la camara");
            this.closeCameraModal();
            return;
        }

        // Capture photo
        captureBtn.onclick = () => this.capturePhoto();

        // Record video
        recordBtn.onclick = () => {
            if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        };

        // Switch camera
        document.getElementById("cameraSwitchBtn").onclick = async () => {
            this.cameraFacingMode = this.cameraFacingMode === "user" ? "environment" : "user";
            await this.startCameraStream();
        };

        // Close
        document.getElementById("cameraModalClose").onclick = () => this.closeCameraModal();
        modal.onclick = (e) => {
            if (e.target === modal) this.closeCameraModal();
        };
    },

    async startCameraStream() {
        const preview = document.getElementById("cameraPreview");
        if (!preview) return;

        // Stop existing stream
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(t => t.stop());
        }

        const isMobileCam = /Android|iPhone|iPad/i.test(navigator.userAgent);
        const constraints = {
            video: { facingMode: this.cameraFacingMode, width: { ideal: isMobileCam ? 640 : 1280 }, height: { ideal: isMobileCam ? 480 : 720 } },
            audio: this.cameraMode === "video"
        };

        this.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        preview.srcObject = this.cameraStream;
    },

    capturePhoto() {
        const preview = document.getElementById("cameraPreview");
        const canvas = document.getElementById("cameraCanvas");
        if (!preview || !canvas) return;

        canvas.width = preview.videoWidth;
        canvas.height = preview.videoHeight;
        canvas.getContext("2d").drawImage(preview, 0, 0);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], "camera-photo-" + Date.now() + ".jpg", { type: "image/jpeg" });
            this.selectedImages.push({
                file: file,
                previewUrl: URL.createObjectURL(blob),
                type: "image"
            });
            this.renderImagePreviews();
            this.updateImageButton();
            this.closeCameraModal();
            window.LaTandaPopup && window.LaTandaPopup.showSuccess("Foto capturada");
        }, "image/jpeg", 0.9);
    },

    startRecording() {
        const preview = document.getElementById("cameraPreview");
        const recordBtn = document.getElementById("cameraRecordBtn");
        const timerEl = document.getElementById("cameraTimer");
        if (!this.cameraStream) return;

        this.recordedChunks = [];
        const isMobileRec = /Android|iPhone|iPad/i.test(navigator.userAgent);
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? "video/webm;codecs=vp8" :
                         MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" :
                         MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "video/mp4";

        this.mediaRecorder = new MediaRecorder(this.cameraStream, { mimeType, videoBitsPerSecond: isMobileRec ? 1500000 : 2500000 });
        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.recordedChunks.push(e.data);
        };
        this.mediaRecorder.onstop = () => this.handleRecordingComplete();

        this.mediaRecorder.start(1000);
        recordBtn.classList.add("recording");
        recordBtn.innerHTML = '<i class="fas fa-stop"></i>';
        timerEl.style.display = "";
        this.recordingSeconds = 0;
        timerEl.textContent = "00:00";

        this.recordingTimer = setInterval(() => {
            this.recordingSeconds++;
            const mins = String(Math.floor(this.recordingSeconds / 60)).padStart(2, "0");
            const secs = String(this.recordingSeconds % 60).padStart(2, "0");
            timerEl.textContent = mins + ":" + secs;

            if (this.recordingSeconds >= (this.maxVideoDuration || 60)) {
                this.stopRecording();
            }
        }, 1000);
    },

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
            this.mediaRecorder.stop();
        }
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        const recordBtn = document.getElementById("cameraRecordBtn");
        if (recordBtn) {
            recordBtn.classList.remove("recording");
            recordBtn.innerHTML = '<i class="fas fa-circle"></i>';
        }
    },

    handleRecordingComplete() {
        if (this.recordedChunks.length === 0) return;
        const ext = this.recordedChunks[0].type.includes("webm") ? ".webm" : ".mp4";
        const blob = new Blob(this.recordedChunks, { type: this.recordedChunks[0].type });
        const file = new File([blob], "camera-video-" + Date.now() + ext, { type: blob.type });

        if (file.size > (this.maxVideoSize || 50 * 1024 * 1024)) {
            window.LaTandaPopup && window.LaTandaPopup.showWarning("Video excede 50MB");
            this.closeCameraModal();
            return;
        }

        this.selectedImages.push({
            file: file,
            previewUrl: URL.createObjectURL(blob),
            type: "video"
        });
        this.renderImagePreviews();
        this.updateImageButton();
        this.closeCameraModal();
        window.LaTandaPopup && window.LaTandaPopup.showSuccess("Video grabado (" + this.recordingSeconds + "s)");
    },

    closeCameraModal() {
        const modal = document.getElementById("cameraModal");
        if (modal) modal.classList.remove("show");

        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(t => t.stop());
            this.cameraStream = null;
        }
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
            this.mediaRecorder.stop();
        }
        this.mediaRecorder = null;
        this.recordedChunks = [];
    },

    setupVideoOverlays() {
        if (!this.container) return;
        // Pause all other feed videos when one starts playing
        this.container.addEventListener("play", (e) => {
            if (e.target.tagName === "VIDEO") {
                const wrapper = e.target.closest(".media-video-wrapper");
                if (wrapper) {
                    const overlay = wrapper.querySelector(".video-play-overlay");
                    if (overlay) overlay.style.opacity = "0";
                }
                // Pause all other feed videos
                this.container.querySelectorAll(".media-video-wrapper video").forEach(v => {
                    if (v !== e.target && !v.paused) v.pause();
                });
            }
        }, true);
        this.container.addEventListener("pause", (e) => {
            if (e.target.tagName === "VIDEO") {
                const wrapper = e.target.closest(".media-video-wrapper");
                if (wrapper) {
                    const overlay = wrapper.querySelector(".video-play-overlay");
                    if (overlay) overlay.style.opacity = "1";
                }
            }
        }, true);
        // Pause videos when scrolled out of view
        this.videoVisibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && entry.target.tagName === "VIDEO" && !entry.target.paused) {
                    entry.target.pause();
                }
            });
        }, { threshold: 0.25 });
    },

    // ========================================
    // EMOJI PICKER - Added 2026-02-05
    // ========================================
    emojiCategories: {
        caritas: ['😀','😁','😂','🤣','😊','😍','🥰','😘','😜','🤔','😴','😭','🥺','😤','😎','🤯','🥳','🫡','🫣','😅','😇','🤩','😋','😝','🤗','🤫','🤭','😏','😒','🙄','😬','😱','😈'],
        manos: ['👍','👎','👏','🙌','🤝','✌️','🤞','👋','🫶','💪','🙏','🤙','👆','👇','👉','👈','🤟','🫰','🤌','👊','✊','🤜','🤛','🫳','🫴'],
        corazones: ['❤️','🧡','💛','💚','💙','💜','🤍','🖤','💗','💕','💞','💓','💔','🫀','💘','💝','💖','🤎','❤️‍🔥','❤️‍🩹'],
        objetos: ['🔥','⭐','💰','🎯','🎲','🏆','🎉','✅','❌','⚡','🚀','💡','🎵','📸','🛒','🎮','📱','💻','🎨','🏠','🚗','✈️','🍕','🍺','☕'],
        simbolos: ['💯','🔔','📌','🏷️','💎','🌟','☀️','🌈','🍀','🎁','📊','🗓️','⏰','🔒','🔑','✨','💥','🎶','🏁','♻️','⚠️','🔗','📍']
    },

    setupEmojiPicker() {
        const btn = document.getElementById("composeEmojiBtn");
        const panel = document.getElementById("composeEmojiPanel");
        if (!btn || !panel) return;

        // Render initial category
        this.renderEmojiCategory("caritas");

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Blur textarea to dismiss mobile keyboard
            const composeInput = document.getElementById("composeInput");
            if (composeInput) composeInput.blur();
            // Close other panels
            this.closeGifPanel();
            this.closePollPanel();
            panel.style.display = panel.style.display === "none" ? "block" : "none";
        });

        // Tab switching
        panel.addEventListener("click", (e) => {
            const tab = e.target.closest(".emoji-tab");
            if (tab) {
                panel.querySelectorAll(".emoji-tab").forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                this.renderEmojiCategory(tab.dataset.cat);
            }
            const emojiSpan = e.target.closest(".emoji-item");
            if (emojiSpan) {
                this.insertEmojiAtCursor(emojiSpan.textContent);
            }
        });

        // Close on outside click
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".compose-emoji-wrapper") && !e.target.closest(".compose-emoji-panel")) {
                panel.style.display = "none";
            }
        });
    },

    renderEmojiCategory(cat) {
        const grid = document.getElementById("emojiGrid");
        if (!grid) return;
        const emojis = this.emojiCategories[cat] || [];
        grid.innerHTML = emojis.map(e => '<span class="emoji-item">' + e + '</span>').join("");
    },

    insertEmojiAtCursor(emoji) {
        const input = document.getElementById("composeInput");
        if (!input) return;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const text = input.value;
        input.value = text.substring(0, start) + emoji + text.substring(end);
        input.focus();
        const newPos = start + emoji.length;
        input.setSelectionRange(newPos, newPos);
        // Trigger auto-resize
        input.dispatchEvent(new Event("input"));
    },

    // ========================================
    // POLL CREATOR - Added 2026-02-05
    // ========================================
    pollActive: false,

    setupPollCreator() {
        const btn = document.getElementById("composePollBtn");
        const panel = document.getElementById("composePollPanel");
        const closeBtn = document.getElementById("pollPanelClose");
        const addBtn = document.getElementById("pollAddOption");
        if (!btn || !panel) return;

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Blur textarea to dismiss mobile keyboard
            const composeInput = document.getElementById("composeInput");
            if (composeInput) composeInput.blur();
            this.closeEmojiPanel();
            this.closeGifPanel();
            if (this.pollActive) {
                this.closePollPanel();
            } else {
                panel.style.display = "block";
                this.pollActive = true;
                btn.classList.add("active");
                // Disable media when poll is active
                this.clearAllImages();
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener("click", () => this.closePollPanel());
        }

        if (addBtn) {
            addBtn.addEventListener("click", () => {
                const list = document.getElementById("pollOptionsList");
                const inputs = list.querySelectorAll(".poll-option-input");
                if (inputs.length >= 4) {
                    window.LaTandaPopup && window.LaTandaPopup.showWarning("Maximo 4 opciones");
                    return;
                }
                const newInput = document.createElement("input");
                newInput.className = "poll-option-input";
                newInput.type = "text";
                newInput.placeholder = "Opcion " + (inputs.length + 1);
                newInput.maxLength = 80;
                list.appendChild(newInput);
                newInput.focus();
                if (inputs.length + 1 >= 4) addBtn.style.display = "none";
            });
        }
    },

    closePollPanel() {
        const panel = document.getElementById("composePollPanel");
        const btn = document.getElementById("composePollBtn");
        if (panel) panel.style.display = "none";
        if (btn) btn.classList.remove("active");
        this.pollActive = false;
    },

    getPollData() {
        if (!this.pollActive) return null;
        const list = document.getElementById("pollOptionsList");
        const duration = document.getElementById("pollDuration");
        if (!list) return null;
        const inputs = list.querySelectorAll(".poll-option-input");
        const options = [];
        inputs.forEach(input => {
            const val = input.value.trim();
            if (val) options.push(val);
        });
        if (options.length < 2) return null;
        return {
            options: options,
            duration_hours: parseInt(duration ? duration.value : "72")
        };
    },

    closeEmojiPanel() {
        const panel = document.getElementById("composeEmojiPanel");
        if (panel) panel.style.display = "none";
    },

    // ========================================
    // GIF SELECTOR - Added 2026-02-05
    // ========================================
    gifSearchTimeout: null,
    selectedGif: null,

    setupGifSelector() {
        const btn = document.getElementById("composeGifBtn");
        const panel = document.getElementById("composeGifPanel");
        const searchInput = document.getElementById("gifSearchInput");
        if (!btn || !panel) return;

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeEmojiPanel();
            this.closePollPanel();
            if (panel.style.display === "block") {
                this.closeGifPanel();
            } else {
                // Blur textarea to dismiss mobile keyboard
                const composeInput = document.getElementById("composeInput");
                if (composeInput) composeInput.blur();
                panel.style.display = "block";
                this.loadTrendingGifs();
                // Only auto-focus search on desktop (not mobile - it triggers keyboard)
                if (searchInput && !this.isMobileDevice()) searchInput.focus();
            }
        });

        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                clearTimeout(this.gifSearchTimeout);
                const q = e.target.value.trim();
                this.gifSearchTimeout = setTimeout(() => {
                    if (q.length > 1) {
                        this.searchGifs(q);
                    } else {
                        this.loadTrendingGifs();
                    }
                }, 400);
            });
        }

        // Close on outside click
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".compose-gif-wrapper") && !e.target.closest(".compose-gif-panel")) {
                this.closeGifPanel();
            }
        });

        // Click on GIF grid
        const grid = document.getElementById("gifGrid");
        if (grid) {
            grid.addEventListener("click", (e) => {
                const img = e.target.closest(".gif-item img");
                if (img) {
                    this.selectGif(img.dataset.full);
                }
            });
        }
    },

    closeGifPanel() {
        const panel = document.getElementById("composeGifPanel");
        if (panel) panel.style.display = "none";
    },

    async loadTrendingGifs() {
        const grid = document.getElementById("gifGrid");
        if (!grid) return;
        grid.innerHTML = '<div class="gif-loading"><i class="fas fa-spinner fa-spin"></i></div>';
        try {
            const response = await fetch("/api/gifs/trending");
            const result = await response.json();
            if (result.success && result.data) {
                this.renderGifGrid(result.data);
            } else {
                grid.innerHTML = '<div class="gif-empty">No se pudieron cargar GIFs</div>';
            }
        } catch (err) {
            grid.innerHTML = '<div class="gif-empty">Error al cargar GIFs</div>';
        }
    },

    async searchGifs(query) {
        const grid = document.getElementById("gifGrid");
        if (!grid) return;
        grid.innerHTML = '<div class="gif-loading"><i class="fas fa-spinner fa-spin"></i></div>';
        try {
            const response = await fetch("/api/gifs/search?q=" + encodeURIComponent(query));
            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
                this.renderGifGrid(result.data);
            } else {
                grid.innerHTML = '<div class="gif-empty">No se encontraron GIFs</div>';
            }
        } catch (err) {
            grid.innerHTML = '<div class="gif-empty">Error al buscar GIFs</div>';
        }
    },

    renderGifGrid(gifs) {
        const grid = document.getElementById("gifGrid");
        if (!grid) return;
        grid.innerHTML = gifs.map(g =>
            '<div class="gif-item"><img src="' + this.escapeHtml(g.preview || g.url) + '" data-full="' + this.escapeHtml(g.url) + '" alt="GIF" loading="lazy"></div>'
        ).join("");
    },

    selectGif(url) {
        if (!url) return;
        this.selectedGif = url;
        // Clear regular media and poll
        this.clearAllImages();
        this.closePollPanel();
        this.closeGifPanel();
        // Show GIF preview
        const container = document.getElementById("composeImagesPreview");
        if (container) {
            container.style.display = "grid";
            container.className = "compose-images-preview preview-1";
            container.innerHTML =
                '<div class="preview-item">' +
                    '<img src="' + this.escapeHtml(url) + '" alt="GIF">' +
                    '<button class="remove-image" data-index="gif" title="Eliminar">' +
                        '<i class="fas fa-times"></i>' +
                    '</button>' +
                    '<span class="gif-badge">GIF</span>' +
                '</div>';
            container.querySelector(".remove-image").addEventListener("click", () => {
                this.selectedGif = null;
                container.style.display = "none";
                container.innerHTML = "";
            });
        }
        window.LaTandaPopup && window.LaTandaPopup.showSuccess("GIF seleccionado");
    },

    // ========================================
    // POLL DISPLAY - Added 2026-02-05
    // ========================================
    renderPollDisplay(event) {
        const meta = event.metadata || {};
        if (!meta.poll) return '';

        const poll = meta.poll;
        const options = poll.options || [];
        const votes = poll.votes || options.map(() => 0);
        const totalVotes = poll.total_votes || votes.reduce((a, b) => a + b, 0);
        const expiresAt = poll.expires_at ? new Date(poll.expires_at) : null;
        const isExpired = expiresAt && expiresAt < new Date();
        const userVote = poll.user_vote !== undefined ? poll.user_vote : null;
        const hasVoted = userVote !== null;
        const showResults = hasVoted || isExpired;

        let timeText = '';
        if (isExpired) {
            timeText = 'Finalizada';
        } else if (expiresAt) {
            const diff = expiresAt - new Date();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (days > 0) timeText = 'Quedan ' + days + ' dia' + (days > 1 ? 's' : '');
            else if (hours > 0) timeText = 'Quedan ' + hours + ' hora' + (hours > 1 ? 's' : '');
            else timeText = 'Menos de 1 hora';
        }

        let optionsHtml = '';
        if (showResults) {
            optionsHtml = options.map((opt, i) => {
                const count = votes[i] || 0;
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const isWinner = count === Math.max(...votes) && totalVotes > 0;
                const isUserVote = userVote === i;
                return '<div class="poll-result-bar ' + (isWinner ? 'winner' : '') + '">' +
                    '<div class="poll-bar-fill" style="width:' + pct + '%"></div>' +
                    '<span class="poll-option-text">' + (isUserVote ? '<i class="fas fa-check-circle"></i> ' : '') + this.escapeHtml(opt) + '</span>' +
                    '<span class="poll-option-pct">' + pct + '%</span>' +
                '</div>';
            }).join('');
        } else {
            optionsHtml = options.map((opt, i) =>
                '<button class="poll-vote-btn" data-event-id="' + this.escapeHtml(String(event.id)) + '" data-option="' + i + '">' +
                    this.escapeHtml(opt) +
                '</button>'
            ).join('');
        }

        return '<div class="poll-display" data-event-id="' + event.id + '">' +
            optionsHtml +
            '<div class="poll-info">' + totalVotes + ' voto' + (totalVotes !== 1 ? 's' : '') + (timeText ? ' · ' + timeText : '') + '</div>' +
        '</div>';
    },

    async handlePollVote(eventId, optionIndex) {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("authToken");
        if (!token) {
            window.LaTandaPopup && window.LaTandaPopup.showError("Inicia sesion para votar");
            return;
        }

        try {
            const response = await fetch("/api/feed/social/" + eventId + "/vote", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ option_index: optionIndex })
            });

            const result = await response.json();
            if (result.success) {
                // Update local event data
                const event = this.events.find(e => String(e.id) === eventId);
                if (event && event.metadata) {
                    event.metadata.poll = result.data.poll;
                }
                this.renderEvents();
                window.LaTandaPopup && window.LaTandaPopup.showSuccess("Voto registrado");
            } else {
                window.LaTandaPopup && window.LaTandaPopup.showWarning(result.message || "Error al votar");
            }
        } catch (err) {
            window.LaTandaPopup && window.LaTandaPopup.showError("Error al votar");
        }
    },

    // ========================================
    // LOCATION - Added 2026-02-06
    // ========================================
    selectedLocation: null,

    setupLocation() {
        const btn = document.getElementById("composeLocationBtn");
        const panel = document.getElementById("composeLocationPanel");
        const closeBtn = document.getElementById("locationPanelClose");
        const detectBtn = document.getElementById("locationDetectBtn");
        const input = document.getElementById("locationInput");
        if (!btn || !panel) return;

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const composeInput = document.getElementById("composeInput");
            if (composeInput) composeInput.blur();
            this.closeEmojiPanel();
            this.closeGifPanel();
            this.closePollPanel();
            if (panel.style.display === "block") {
                this.closeLocationPanel();
            } else {
                panel.style.display = "block";
                btn.classList.add("active");
                if (input && !this.isMobileDevice()) input.focus();
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener("click", () => this.closeLocationPanel());
        }

        if (input) {
            input.addEventListener("change", () => {
                const val = input.value.trim();
                this.selectedLocation = val || null;
                if (val) {
                    btn.classList.add("active");
                } else {
                    btn.classList.remove("active");
                }
            });
        }

        if (detectBtn) {
            detectBtn.addEventListener("click", () => this.detectLocation());
        }
    },

    closeLocationPanel() {
        const panel = document.getElementById("composeLocationPanel");
        const btn = document.getElementById("composeLocationBtn");
        if (panel) panel.style.display = "none";
        if (!this.selectedLocation && btn) btn.classList.remove("active");
    },

    async detectLocation() {
        const detectBtn = document.getElementById("locationDetectBtn");
        const input = document.getElementById("locationInput");
        if (!navigator.geolocation) {
            window.LaTandaPopup && window.LaTandaPopup.showWarning("Tu navegador no soporta geolocalizacion");
            return;
        }

        if (detectBtn) {
            detectBtn.disabled = true;
            detectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detectando...';
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    // Use free reverse geocoding
                    const response = await fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&format=json&accept-language=es');
                    const data = await response.json();
                    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state || '';
                    const country = data.address?.country || '';
                    const locationText = city ? (city + (country ? ', ' + country : '')) : (data.display_name || '').split(',').slice(0, 2).join(',');

                    if (input && locationText) {
                        input.value = locationText;
                        this.selectedLocation = locationText;
                        const btn = document.getElementById("composeLocationBtn");
                        if (btn) btn.classList.add("active");
                    }
                } catch (err) {
                    window.LaTandaPopup && window.LaTandaPopup.showWarning("No se pudo detectar la ubicacion");
                }
                if (detectBtn) {
                    detectBtn.disabled = false;
                    detectBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Detectar';
                }
            },
            (err) => {
                window.LaTandaPopup && window.LaTandaPopup.showWarning("Permiso de ubicacion denegado");
                if (detectBtn) {
                    detectBtn.disabled = false;
                    detectBtn.innerHTML = '<i class="fas fa-crosshairs"></i> Detectar';
                }
            },
            { enableHighAccuracy: false, timeout: 10000 }
        );
    },

    // ========================================
    // IMAGE LIGHTBOX - Added 2026-02-06
    // ========================================
    lightboxUrls: [],
    lightboxIndex: 0,

    setupLightbox() {
        const lightbox = document.getElementById("mediaLightbox");
        const closeBtn = document.getElementById("lightboxClose");
        const prevBtn = document.getElementById("lightboxPrev");
        const nextBtn = document.getElementById("lightboxNext");
        const backdrop = lightbox ? lightbox.querySelector(".lightbox-backdrop") : null;
        if (!lightbox) return;

        if (closeBtn) closeBtn.addEventListener("click", () => this.closeLightbox());
        if (backdrop) backdrop.addEventListener("click", () => this.closeLightbox());
        if (prevBtn) prevBtn.addEventListener("click", (e) => { e.stopPropagation(); this.lightboxNav(-1); });
        if (nextBtn) nextBtn.addEventListener("click", (e) => { e.stopPropagation(); this.lightboxNav(1); });

        // Keyboard navigation
        document.addEventListener("keydown", (e) => {
            if (!lightbox.classList.contains("active")) return;
            if (e.key === "Escape") this.closeLightbox();
            if (e.key === "ArrowLeft") this.lightboxNav(-1);
            if (e.key === "ArrowRight") this.lightboxNav(1);
        });

        // Touch swipe support
        let touchStartX = 0;
        let touchStartY = 0;
        const content = document.getElementById("lightboxContent");
        if (content) {
            content.addEventListener("touchstart", (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }, { passive: true });

            content.addEventListener("touchend", (e) => {
                const dx = e.changedTouches[0].clientX - touchStartX;
                const dy = e.changedTouches[0].clientY - touchStartY;
                // Only swipe if horizontal movement > 50px and more horizontal than vertical
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                    if (dx > 0) this.lightboxNav(-1);
                    else this.lightboxNav(1);
                }
                // Swipe down to close
                if (dy > 100 && Math.abs(dy) > Math.abs(dx)) {
                    this.closeLightbox();
                }
            }, { passive: true });
        }
    },

    openLightbox(urls, index) {
        this.lightboxUrls = urls;
        this.lightboxIndex = index || 0;
        const lightbox = document.getElementById("mediaLightbox");
        if (!lightbox) return;

        this.updateLightboxImage();
        lightbox.classList.add("active");
        document.body.style.overflow = "hidden";
    },

    closeLightbox() {
        const lightbox = document.getElementById("mediaLightbox");
        if (!lightbox) return;
        lightbox.classList.remove("active");
        document.body.style.overflow = "";
        // Clear src to stop GIF/video loading
        const img = document.getElementById("lightboxImg");
        if (img) img.src = "";
        const video = document.getElementById("lightboxVideo");
        if (video) { video.pause(); video.src = ""; video.style.display = "none"; }
    },

    lightboxNav(direction) {
        if (this.lightboxUrls.length <= 1) return;
        this.lightboxIndex = (this.lightboxIndex + direction + this.lightboxUrls.length) % this.lightboxUrls.length;
        this.updateLightboxImage();
    },

    updateLightboxImage() {
        const img = document.getElementById("lightboxImg");
        const video = document.getElementById("lightboxVideo");
        const counter = document.getElementById("lightboxCounter");
        const prevBtn = document.getElementById("lightboxPrev");
        const nextBtn = document.getElementById("lightboxNext");
        const url = this.lightboxUrls[this.lightboxIndex];

        if (this.isVideoUrl(url)) {
            if (img) { img.style.display = "none"; img.src = ""; }
            if (video) {
                video.pause();
                video.style.display = "block";
                video.src = url;
                video.load();
            }
        } else {
            if (video) { video.pause(); video.src = ""; video.style.display = "none"; }
            if (img) {
                img.style.display = "block";
                img.classList.remove("loaded");
                img.src = url;
                img.onload = () => img.classList.add("loaded");
            }
        }

        const total = this.lightboxUrls.length;
        if (counter) {
            counter.textContent = total > 1 ? (this.lightboxIndex + 1) + " / " + total : "";
        }
        if (prevBtn) prevBtn.style.display = total > 1 ? "" : "none";
        if (nextBtn) nextBtn.style.display = total > 1 ? "" : "none";
    },

    // ========================================
    // INCOGNITO MODE - Added 2026-02-06
    // ========================================
    incognitoMode: false,

    setupIncognito() {
        const btn = document.getElementById("composeIncognitoBtn");
        const bar = document.getElementById("composeIncognitoBar");
        const closeBtn = document.getElementById("incognitoBarClose");
        if (!btn) return;

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const composeInput = document.getElementById("composeInput");
            if (composeInput) composeInput.blur();
            this.incognitoMode = !this.incognitoMode;
            if (this.incognitoMode) {
                btn.classList.add("active");
                if (bar) bar.style.display = "flex";
            } else {
                btn.classList.remove("active");
                if (bar) bar.style.display = "none";
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                this.incognitoMode = false;
                btn.classList.remove("active");
                if (bar) bar.style.display = "none";
            });
        }
    },

    openCompose() {
        const composeBox = document.getElementById("composeBox");
        const composeInput = document.getElementById("composeInput");
        if (composeBox) {
            composeBox.scrollIntoView({ behavior: "smooth", block: "center" });
            // Highlight the compose box briefly
            composeBox.classList.add("compose-highlight");
            setTimeout(() => {
                if (composeInput) composeInput.focus();
                setTimeout(() => composeBox.classList.remove("compose-highlight"), 1500);
            }, 400);
        }
    },

    setupViewTracking() {
        const viewedKey = 'sf_viewed';
        // Load previously viewed IDs from sessionStorage
        let viewedSet;
        try {
            const stored = sessionStorage.getItem(viewedKey);
            viewedSet = stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (e) { viewedSet = new Set(); }

        this.viewObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const card = entry.target;
                const eventId = card.dataset.eventId;
                if (!eventId) return;

                if (entry.isIntersecting) {
                    // Skip if already viewed this session
                    if (viewedSet.has(eventId)) return;
                    // Start 2-second timer
                    this.viewTimers[eventId] = setTimeout(() => {
                        viewedSet.add(eventId);
                        this.pendingViews.add(eventId);
                        try { sessionStorage.setItem(viewedKey, JSON.stringify([...viewedSet])); } catch (e) {}
                        delete this.viewTimers[eventId];
                    }, 2000);
                } else {
                    // Card left viewport — cancel timer
                    if (this.viewTimers[eventId]) {
                        clearTimeout(this.viewTimers[eventId]);
                        delete this.viewTimers[eventId];
                    }
                }
            });
        }, { threshold: 0.5 });

        // Flush pending views every 3 seconds
        this.viewFlushInterval = setInterval(() => this.flushViewTracker(), 3000);

        // Flush on page unload
        window.addEventListener('beforeunload', () => this.flushViewTracker(true));
    },

    flushViewTracker(useBeacon) {
        if (this.pendingViews.size === 0) return;
        const ids = [...this.pendingViews];
        this.pendingViews.clear();
        const payload = JSON.stringify({ event_ids: ids });

        if (useBeacon && navigator.sendBeacon) {
            navigator.sendBeacon('/api/feed/social/track-views', new Blob([payload], { type: 'application/json' }));
        } else {
            fetch('/api/feed/social/track-views', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
            }).catch(() => {});
        }
    },

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        if (this.videoVisibilityObserver) {
            this.videoVisibilityObserver.disconnect();
            this.videoVisibilityObserver = null;
        }
        if (this.viewObserver) {
            this.viewObserver.disconnect();
            this.viewObserver = null;
        }
        if (this.viewFlushInterval) {
            clearInterval(this.viewFlushInterval);
            this.viewFlushInterval = null;
        }
        this.flushViewTracker();
        this.events = [];
        this.offset = 0;
        this.hasMore = true;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("socialFeedContainer");
    if (container) {
        SocialFeed.init("socialFeedContainer");
    }
});
