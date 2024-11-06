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

  // Handle logout button visibility and functionality
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    const usernameDisplay = document.getElementById("username-display");
    if (usernameDisplay && usernameDisplay.textContent) {
      logoutButton.style.display = "block"; // Show the logout button if the user is authenticated
      logoutButton.addEventListener("click", function () {
        fetch("/api/logout", {
          method: "POST",
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Logout failed");
            }
            return response.json();
          })
          .then((data) => {
            alert(data.message); // Optional: Show a success message
            window.location.href = "/sign-in"; // Redirect to sign-in page after logout
          })
          .catch((error) => {
            console.error("Error during logout:", error);
            alert("Error during logout: " + error.message); // Show error message
          });
      });
    } else {
      logoutButton.style.display = "none"; // Hide the logout button if not authenticated
    }
  }
});

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
            <button class="like-button" data-post-id="${
              post.id
            }" data-liked="false" style="background-color: white;">
              👍 Like (<span class="like-count">${post.likes || 0}</span>)
            </button>
            <hr>
            <div class="comments-section" id="comments-${post.id}">
              <h4>Comments:</h4>
              <div class="comments-container" id="comments-container-${
                post.id
              }"></div>
              <input type="text" id="comment-input-${
                post.id
              }" placeholder="Add a comment...">
              <button onclick="addComment(${post.id})">Post Comment</button>
            </div>
          `;

          postsContainer.appendChild(postElement);
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching posts:", error);
      alert("Error fetching posts: " + error.message); // Show error message
    });
}

function handleLike(event) {
  const button = event.target;
  const postId = button.getAttribute("data-post-id");
  const liked = button.getAttribute("data-liked") === "true";

  const method = liked ? "DELETE" : "POST"; // Toggle method based on current state

  fetch(`/api/posts/${postId}/like`, { method })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to " + (liked ? "unlike" : "like") + " post");
      }
      // Toggle the like state
      likedPosts[postId] = !liked;
      button.setAttribute("data-liked", !liked); // Update the data attribute

      // Update the like count
      const likeCountElement = button.querySelector(".like-count");
      likeCountElement.textContent =
        parseInt(likeCountElement.textContent) + (liked ? -1 : 1);
      button.classList.toggle("liked"); // Toggle the 'liked' class for styling
    })
    .catch((error) => {
      console.error("Error liking/unliking post:", error);
      alert("Failed to " + (liked ? "unlike" : "like") + " post");
    });
}

function handleComment(event) {
  const button = event.target;
  const postId = button.getAttribute("data-post-id");
  const commentInput = document.getElementById(`comment-input-${postId}`);
  const commentContent = commentInput.value;

  if (commentContent.trim() === "") {
    alert("Comment cannot be empty.");
    return;
  }

  fetch(`/api/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: commentContent }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to add comment");
      }
      return response.json();
    })
    .then(() => {
      commentInput.value = ""; // Clear the input
      fetchComments(postId); // Refresh comments
    })
    .catch((error) => {
      console.error("Error adding comment:", error);
      alert("Failed to add comment");
    });
}

function fetchComments(postId) {
  fetch(`/api/posts/${postId}/comments`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error fetching comments");
      }
      return response.json();
    })
    .then((comments) => {
      const commentsContainer = document.getElementById(
        `comments-container-${postId}`
      );
      commentsContainer.innerHTML = ""; // Clear existing comments

      comments.forEach((comment) => {
        const commentElement = document.createElement("div");
        commentElement.innerHTML = `
          <strong>${comment.username}:</strong> ${comment.content}
          <small> (${new Date(comment.createdAt).toLocaleString()})</small>
          <hr>
        `;
        commentsContainer.appendChild(commentElement);
      });
    })
    .catch((error) => {
      console.error("Error fetching comments:", error);
    });
}

// After successful logout response
// Assuming you have a way to check if the user is logged in
const isUserLoggedIn = document.querySelector("#username-display").textContent;

if (isUserLoggedIn) {
  // Only call logout when the user is logged in
  fetch("/api/logout")
    .then((response) => {
      if (response.ok) {
        alert("Logout successful");
        window.location.href = "/"; // Redirect to sign-in page
      }
    })
    .catch((error) => console.error("Logout error:", error));
}

document.getElementById("logout-button").addEventListener("click", function () {
  fetch("/api/logout")
    .then((response) => {
      if (response.ok) {
        alert("Logout successful");
        window.location.href = "/"; // Redirect to sign-in page
      }
    })
    .catch((error) => console.error("Logout error:", error));
});
