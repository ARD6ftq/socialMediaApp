document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form"); // Select the form element

  if (form) {
    form.addEventListener("submit", function (event) {
      const FirstName = document.getElementById("Firstname").value;
      const LastName = document.getElementById("Lastname").value;
      const Email = document.getElementById("Email").value;
      const Username = document.getElementById("Username").value;
      const Password = document.getElementById("Password").value;
      const ConfirmPassword = document.getElementById("ConfirmPassword").value;

      if (
        !FirstName ||
        !LastName ||
        !Email ||
        !Username ||
        !Password ||
        !ConfirmPassword
      ) {
        alert("All fields are required.");
        event.preventDefault();
      } else if (Password !== ConfirmPassword) {
        alert("Passwords do not match.");
        event.preventDefault();
      }
    });
  } else {
    console.warn("Form not found.");
  }

  // Fetch current user and display their username
  fetchCurrentUser();

  // Fetch and display all posts
  fetchPosts();

  // Add event listeners for modal and post functionality
  setupPostModal();
  setupBioEditing();
});

// Toggle password visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const type = input.getAttribute("type") === "password" ? "text" : "password";
  input.setAttribute("type", type);

  // Optionally, change the icon based on the visibility
  const icon = event.target;
  icon.textContent = type === "password" ? "👁️" : "👁️‍🗨️";
}

// Banner image preview
function previewBanner(event) {
  const bannerPreview = document.getElementById("banner-preview");
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    bannerPreview.innerHTML = `<img src="${e.target.result}" alt="Banner Image" />`;
  };

  if (file) {
    reader.readAsDataURL(file);
  }
}

// Profile picture preview
function previewProfilePic(event) {
  const profilePreview = document.getElementById("profile-preview");
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    profilePreview.innerHTML = `<img src="${e.target.result}" alt="Profile Picture" />`;
  };

  if (file) {
    reader.readAsDataURL(file);
  }
}

// Setup post modal
function setupPostModal() {
  const modal = document.getElementById("post-modal");
  const postIcon = document.getElementById("post-icon");
  const closeModal = document.getElementById("close-modal");

  if (postIcon && modal) {
    postIcon.addEventListener("click", (event) => {
      event.preventDefault();
      modal.style.display = "block";
    });
  } else {
    console.warn("Post icon or modal not found.");
  }

  if (closeModal) {
    closeModal.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", (event) => {
    if (modal && event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Handle post submission
  const submitPostButton = document.getElementById("submit-post");
  const postsContainer = document.getElementById("posts-container");

  if (submitPostButton) {
    submitPostButton.addEventListener("click", function () {
      const postText = document.getElementById("post-text").value;

      if (postText.trim() !== "") {
        // Send the post to the server
        console.log("Sending post content:", { content: postText }); // Debug log

        fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: postText }), // Send post content
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to create post: " + response.statusText);
            }
            return response.json();
          })
          .then(() => {
            document.getElementById("post-text").value = ""; // Clear the input
            modal.style.display = "none"; // Close the modal
            fetchPosts(); // Fetch and display all posts again
          })
          .catch((error) => {
            console.error("Error creating post:", error);
            alert("Error creating post: " + error.message); // Alert the user
          });
      } else {
        alert("Post content cannot be empty."); // Alert if post is empty
      }
    });
  } else {
    console.warn("Submit post button not found.");
  }
}

// Setup bio editing
function setupBioEditing() {
  const editButton = document.getElementById("editButton");
  const saveBioButton = document.getElementById("saveBioButton");

  if (editButton) {
    editButton.addEventListener("click", function () {
      document.getElementById("bioInput").style.display = "block";
      saveBioButton.style.display = "inline-block";
      editButton.style.display = "none";
    });
  } else {
    console.warn("Edit button not found.");
  }

  if (saveBioButton) {
    saveBioButton.addEventListener("click", function () {
      const bio = document.getElementById("bioInput").value;
      document.getElementById("bioDisplay").innerText =
        bio.trim() !== "" ? bio : "No bio added yet.";
      document.getElementById("bioInput").style.display = "none";
      saveBioButton.style.display = "none";
      editButton.style.display = "inline-block";
    });
  } else {
    console.warn("Save bio button not found.");
  }
}

// Fetch current user and display their username
function fetchCurrentUser() {
  fetch("/api/current_user")
    .then((response) => {
      if (!response.ok) {
        throw new Error("User not found");
      }
      return response.json();
    })
    .then((data) => {
      const usernameDisplay = document.getElementById("username-display");
      if (usernameDisplay) {
        usernameDisplay.textContent = `Welcome, ${data.username}!`;
      } else {
        console.error("Username display element not found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching the current user:", error);
    });
}

// Fetch and display all posts
function fetchPosts() {
  fetch("/api/posts")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error fetching posts");
      }
      return response.json();
    })
    .then((posts) => {
      const postsContainer = document.getElementById("posts-container");
      if (postsContainer) {
        postsContainer.innerHTML = ""; // Clear existing posts

        posts.forEach((post) => {
          const postElement = document.createElement("div");
          postElement.className = "post";
          postElement.innerHTML = `
            <h2>${post.username}</h2>
            <p>${post.content}</p>
            <small>Posted on: ${new Date(
              post.createdAt
            ).toLocaleString()}</small>
            <button class="like-button" data-post-id="${post.id}">
              👍 Like (${post.likes || 0})
            </button>
            <hr>
          `;
          postsContainer.appendChild(postElement);
        });

        // Add event listeners to like buttons
        const likeButtons = document.querySelectorAll(".like-button");
        likeButtons.forEach((button) => {
          button.addEventListener("click", handleLike);
        });
      } else {
        console.error("Posts container not found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching posts:", error);
    });
}

function handleLike(event) {
  const postId = event.target.getAttribute("data-post-id");

  fetch(`/api/posts/${postId}/like`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to like post");
      }
      return response.json();
    })
    .then(() => {
      fetchPosts(); // Refresh posts to show updated like count
    })
    .catch((error) => {
      console.error("Error liking post:", error);
      alert("Failed to like post");
    });
}