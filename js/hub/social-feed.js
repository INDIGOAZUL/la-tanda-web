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

// Add the Report button and modal to social feed posts
SocialFeed.prototype.attachReportButtonToPosts = function() {
  const socialFeedPosts = document.querySelectorAll('.social-feed-post');
  socialFeedPosts.forEach(post => {
    // Create report button
    const reportButton = document.createElement('button');
    reportButton.classList.add('report-btn', 'btn btn-primary');
    reportButton.innerHTML = '<i class="fas fa-flag"></i> Report';
    post.appendChild(reportButton);

    // Add click event to open modal
    reportButton.addEventListener('click', () => {
      this.showReportModal(post.getAttribute('data-post-id'));
    });
  });
};

// Function to show the report modal for a given post ID
SocialFeed.prototype.showReportModal = function(postId) {
  const post = document.querySelector(`.social-feed-post[data-post-id="${postId}"]`);
  if (!post) return;

  // Create and style the modal
  const modal = document.createElement('div');
  modal.classList.add('modal', 'fade', 'show');
  modal.setAttribute('tabindex', '-1');

  const modalContent = `
    <div class="modal-dialog">
      <div class="modal-content">
        <button type="button" class="close-btn" data-dismiss="modal">&times;</button>
        <h5 class="modal-title">Report Content</h5>
        <form id="report-form-${postId}">
          <div class="mb-3">
            <label for="reasonSelect" class="col-form-label">Reason:</label>
            <select class="form-select" id="reasonSelect" required>
              <option value="">Choose a reason...</option>
              <option value="spam">Spam</option>
              <option value="harassment">Harassment</option>
              <option value="inaccurate">Inaccurate information</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="mb-3" id="descriptionContainer">
            <label for="descriptionInput" class="col-form-label">Description (optional):</label>
            <textarea class="form-control" id="descriptionInput" rows="4"></textarea>
          </div>
        </form>
      </div>
    </div>
  `;

  modal.innerHTML = modalContent;
  document.body.appendChild(modal);

  // Add event listener to submit form
  const form = document.getElementById(`report-form-${postId}`);
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    const reason = document.getElementById('reasonSelect').value;
    const description = document.getElementById('descriptionInput').value;

    if (!reason || !description) {
      alert('Please select a reason and provide a description.');
      return;
    }

    // Call the API to report content
    fetch(`/api/feed/social/${postId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason, description })
    })
    .then(response => response.json())
    .then(data => {
      alert('Content reported successfully.');
      modal.remove();
      location.reload(); // Refresh the page to reflect the report
    })
    .catch(error => {
      console.error('Error reporting content:', error);
      alert('Failed to report content. Please try again later.');
      modal.remove();
    });
  });

  document.body.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      modal.remove();
    }
  });
};

// Call the method to attach report button to posts
SocialFeed.prototype.init();