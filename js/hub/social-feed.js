const SocialFeed = {
  // ... other methods and properties ...

  attachEngagementHandlers() {
    const likeButtons = document.querySelectorAll('.like-btn');
    likeButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent the default action (e.g., form submission)
        const postId = this.getAttribute('data-post-id'); // Assuming 'data-post-id' is set on each like button
        if (postId) {
          this.dispatchEvent(new CustomEvent('like-clicked', { detail: { postId } }));
        }
      });
    });
  },

  attachTabHandlers() {
    const tabButtons = document.querySelectorAll('.feed-tab');
    tabButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent the default action (e.g., form submission)
        this.classList.add('active');
        this.closest('#feedTabs').querySelectorAll('.feed-tab').forEach(tab => tab.classList.remove('active'));
        const newTabId = this.getAttribute('data-tab');
        if (newTabId) {
          SocialFeed.changeTab(newTabId);
        }
      });
    });
  },

  attachPostMenuHandlers() {
    const postButtons = document.querySelectorAll('.post-menu-btn');
    postButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent the default action (e.g., form submission)
        this.classList.toggle('active');
      });
    });
  },

  init() {
    if (this.initialized) return;
    if (!this.container) return;

    this.loadCurrentUserId();
    try {
      const e = sessionStorage.getItem("socialFeedTab");
      e && this.tabs.find(t => t.id === e) && (this.currentTab = e);
    } catch (e) {}

    this.render();

    const t = new URLSearchParams(window.location.search), a = t.get("hashtag");
    a && (this.currentHashtag = a, setTimeout(() => this.showHashtagFilter(a), 100));

    this.deepLinkEventId = t.get("event") || null;
    window.addEventListener("popstate", function() {
      var e = document.getElementById("postDetailOverlay");
      if (e) (e.classList.remove("pd-active"), setTimeout(function() { e.remove(), document.body.style.overflow="" }, 250));
    });

    const s = t.get("shared_title") || "", i = t.get("shared_text") || "", o = t.get("shared_url") || "";
    if (s || i || o) {
      this._pendingShare = [s, i, o].filter(Boolean).join(" ");
      const e = window.location.pathname;
      window.history.replaceState({ }, "", e);
    }

    this.loadEvents();
    this.loadStories();
    this.setupIntersectionObserver();
    this.setupViewTracking();
    this.attachEngagementHandlers();
    this.attachTabHandlers();
    this.attachPostMenuHandlers();

    this.initialized = !0;
  }
};