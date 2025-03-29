import { loadModel } from './model_viewer_selector.js';

document.addEventListener("DOMContentLoaded", () => {
  setupSearchFilters();
});

/* 🌟 Create Loading Spinner */
const loadingSpinner = document.createElement("div");
loadingSpinner.id = "loading-spinner";
loadingSpinner.innerHTML = `<div class="spinner"></div>`;
document.body.appendChild(loadingSpinner);

function showLoading(callback) {
  loadingSpinner.style.display = "flex"; // Show spinner
  setTimeout(() => {
      loadingSpinner.style.display = "none"; // Hide spinner after delay
      if (callback) callback();
  }, 800);
}

/* 🔄 Smooth Page Transitions */
function switchPage(hidePage, showPage) {
  fadeOut(document.getElementById(hidePage), () => {
      showLoading(() => fadeIn(document.getElementById(showPage)));
  });
}

/* ✨ Fade Animations */
function fadeIn(element) {
  element.style.opacity = 0;
  element.style.display = "block";
  let opacity = 0;
  let interval = setInterval(() => {
      opacity += 0.1;
      element.style.opacity = opacity;
      if (opacity >= 1) clearInterval(interval);
  }, 50);
}

function fadeOut(element, callback) {
  let opacity = 1;
  let interval = setInterval(() => {
      opacity -= 0.1;
      element.style.opacity = opacity;
      if (opacity <= 0) {
          clearInterval(interval);
          element.style.display = "none";
          if (callback) callback();
      }
  }, 50);
}

/* 🔍 Live Search Filtering */
function setupSearchFilters() {
  document.getElementById("search-field-bar").addEventListener("input", searchField);
  document.getElementById("search-model-bar").addEventListener("input", searchModel);
}

function searchField() {
  const searchQuery = document.getElementById('search-field-bar').value.toLowerCase();
  const fieldItems = document.querySelectorAll('.field-item');
  let found = false;

  fieldItems.forEach(item => {
      const fieldName = item.textContent.toLowerCase();
      if (fieldName.includes(searchQuery)) {
          item.style.display = 'block';
          found = true;
      } else {
          item.style.display = 'none';
      }
  });

  document.getElementById('not-found-message').style.display = found ? 'none' : 'block';
}
window.searchField = searchField;

function searchModel() {
  const searchQuery = document.getElementById('search-model-bar').value.toLowerCase();
  const modelItems = document.querySelectorAll('.model-item');
  let found = false;

  modelItems.forEach(item => {
      const modelName = item.textContent.toLowerCase();
      if (modelName.includes(searchQuery)) {
          item.style.display = 'block';
          found = true;
      } else {
          item.style.display = 'none';
      }
  });

  document.getElementById('not-found-message').style.display = found ? 'none' : 'block';
}
window.searchModel = searchModel;

/* 🔗 Fetch Models from Backend */
function sendToBackend(category) {
  return fetch(`http://localhost:5000/api/category/${category}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
  })
  .then(response => response.json())
  .then(data => {
      console.log("Backend response:", data);
      return data;
  })
  .catch(error => {
      console.error('Error sending request to backend:', error);
      return { success: false, message: error.message };
  });
}

async function sendToBackendURL(modelName) {
  try {
      const response = await fetch(`http://localhost:5000/api/getmodel/${modelName}`);
      if (!response.ok) {
          throw new Error(`Failed to fetch model URL: ${response.statusText}`);
      }
      const data = await response.json();
      return data.gcsUrl;
  } catch (error) {
      console.error("Error fetching model URL:", error);
      return null;
  }
}

/* 🎨 Show Models for Selected Field */
function showFieldModels(field) {
  switchPage('main-page', 'model-page');
  console.log('Sent to backend:', field);

  sendToBackend(field).then(response => {
      if (response.success) {
          const models = response.models;
          const modelListContainer = document.getElementById('model-list');

          modelListContainer.innerHTML = '';

          models.forEach(model => {
              const modelItem = document.createElement('div');
              modelItem.classList.add('model-item');
              modelItem.innerHTML = `<h4>${model.name.charAt(0).toUpperCase() + model.name.slice(1)}</h4>`;
              modelItem.onclick = () => {
                  console.log(`Model selected: ${model.name}`);
                  switchPage('model-page', 'display-page');

                  sendToBackendURL(model.name).then(modelUrl => {
                      if (modelUrl) {
                          console.log("Fetched Model URL:", modelUrl);
                          loadModel(modelUrl, model.name);
                      } else {
                          console.error("Error fetching model URL");
                      }
                  }).catch(error => {
                      console.error("Error in fetching model URL:", error);
                  });
              };
              modelListContainer.appendChild(modelItem);
          });
      } else {
          alert('Error loading models for this field.');
      }
  });
}
window.showFieldModels = showFieldModels;

/* 🔙 Navigation Functions */
function backToModelPage() {
  switchPage('display-page', 'model-page');
}
window.backToModelPage = backToModelPage;

function backToMainPage() {
  switchPage('model-page', 'main-page');
}
window.backToMainPage = backToMainPage;