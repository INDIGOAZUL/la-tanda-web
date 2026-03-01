// Get the social feed header element
const socialFeedHeader = document.querySelector('.social-feed-header');

// Create the "Siguiendo" tab element
const siguiendoTab = document.createElement('div');
siguiendoTab.classList.add('tab');
siguiendoTab.textContent = 'Siguiendo';
siguiendoTab.style.color = '#00FFFF'; // Cyan accent color

// Add the "Siguiendo" tab to the social feed header
socialFeedHeader.appendChild(siguiendoTab);

// Add event listener to the "Siguiendo" tab
siguiendoTab.addEventListener('click', () => {
  // Fetch the followed users' posts from the API
  fetch('/api/feed/social/following', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + sessionStorage.getItem('jwtToken'),
    },
  })
  .then(response => response.json())
  .then(data => {
    // Handle pagination
    const offset = 0;
    const limit = 10;
    const posts = data.posts;
    const pagination = data.pagination;

    // Render the followed users' posts
    const socialFeedContainer = document.querySelector('.social-feed-container');
    socialFeedContainer.innerHTML = '';
    posts.forEach(post => {
      const postElement = document.createElement('div');
      postElement.classList.add('post');
      postElement.innerHTML = `
        <h2>${post.title}</h2>
        <p>${post.content}</p>
      `;
      socialFeedContainer.appendChild(postElement);
    });

    // Handle infinite scroll or load more
    if (pagination.hasNext) {
      const loadMoreButton = document.createElement('button');
      loadMoreButton.textContent = 'Load More';
      socialFeedContainer.appendChild(loadMoreButton);
      loadMoreButton.addEventListener('click', () => {
        // Fetch the next page of posts
        fetch('/api/feed/social/following', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem('jwtToken'),
          },
          params: {
            offset: offset + limit,
            limit: limit,
          },
        })
        .then(response => response.json())
        .then(data => {
          // Render the next page of posts
          const nextPosts = data.posts;
          nextPosts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.classList.add('post');
            postElement.innerHTML = `
              <h2>${post.title}</h2>
              <p>${post.content}</p>
            `;
            socialFeedContainer.appendChild(postElement);
          });
        });
      });
    }
  })
  .catch(error => {
    console.error(error);
  });

  // Show an empty state when no followed content exists
  if (posts.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.classList.add('empty-state');
    emptyState.innerHTML = `
      <p>Sigue a otros usuarios para ver sus publicaciones aqui</p>
    `;
    socialFeedContainer.appendChild(emptyState);
  }

  // Persist the selected tab in sessionStorage
  sessionStorage.setItem('selectedTab', 'Siguiendo');
});

// Maintain existing feed functionality
const paraTiTab = document.querySelector('.para-ti-tab');
const tendenciasTab = document.querySelector('.tendencias-tab');

paraTiTab.addEventListener('click', () => {
  // Fetch the "Para Ti" feed from the API
  fetch('/api/feed/social/para-ti', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + sessionStorage.getItem('jwtToken'),
    },
  })
  .then(response => response.json())
  .then(data => {
    // Render the "Para Ti" feed
    const socialFeedContainer = document.querySelector('.social-feed-container');
    socialFeedContainer.innerHTML = '';
    data.posts.forEach(post => {
      const postElement = document.createElement('div');
      postElement.classList.add('post');
      postElement.innerHTML = `
        <h2>${post.title}</h2>
        <p>${post.content}</p>
      `;
      socialFeedContainer.appendChild(postElement);
    });
  })
  .catch(error => {
    console.error(error);
  });
});

tendenciasTab.addEventListener('click', () => {
  // Fetch the "Tendencias" feed from the API
  fetch('/api/feed/social/tendencias', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + sessionStorage.getItem('jwtToken'),
    },
  })
  .then(response => response.json())
  .then(data => {
    // Render the "Tendencias" feed
    const socialFeedContainer = document.querySelector('.social-feed-container');
    socialFeedContainer.innerHTML = '';
    data.posts.forEach(post => {
      const postElement = document.createElement('div');
      postElement.classList.add('post');
      postElement.innerHTML = `
        <h2>${post.title}</h2>
        <p>${post.content}</p>
      `;
      socialFeedContainer.appendChild(postElement);
    });
  })
  .catch(error => {
    console.error(error);
  });
});

// Bonus opportunity: add follower count badge on the "Siguiendo" tab
fetch('/api/feed/social/follower-count', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + sessionStorage.getItem('jwtToken'),
  },
})
.then(response => response.json())
.then(data => {
  const followerCount = data.followerCount;
  siguiendoTab.textContent = `Siguiendo (${followerCount})`;
})
.catch(error => {
  console.error(error);
});