// Function to handle search logic for fields
function searchField() {
    const searchQuery = document.getElementById('search-field-bar').value.toLowerCase();
    const fieldItems = document.querySelectorAll('.field-item');
    let found = false;
  
    // Loop through all field items and show only those that match the search query
    fieldItems.forEach(item => {
      const fieldName = item.textContent.toLowerCase();
      if (fieldName.includes(searchQuery)) {
        item.style.display = 'block';  // Show matching field
        found = true;
      } else {
        item.style.display = 'none';  // Hide non-matching field
      }
    });
  
    // Show or hide "no field found" message based on search results
    const notFoundMessage = document.getElementById('not-found-message');
    notFoundMessage.style.display = found ? 'none' : 'block';
  }
  
  // Attach the searchField function to the input event for real-time search
  document.getElementById('search-field-bar').addEventListener('input', searchField);

  // Search Functionality for Models
function searchModel() {
    const searchQuery = document.getElementById('search-model-bar').value.toLowerCase();
    const modelItems = document.querySelectorAll('.field-item');
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
  
    const notFoundMessage = document.getElementById('not-found-message');
    notFoundMessage.style.display = found ? 'none' : 'block';
  }
  
  // Attach the searchField function to the input event for real-time search
  document.getElementById('search-field-bar').addEventListener('input', searchField);
  
  // Function to send data to the backend using fetch
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

  // Show models for a selected field
function showFieldModels(field) {
    document.getElementById('main-page').classList.remove('active');
    document.getElementById('model-page').classList.add('active');
    console.log('Sent to backend:', field);

    // Send field information to the backend to fetch available models
    sendToBackend(field).then(response => {
        if (response.success) {
            const models = response.models; // List of models from the backend
            const modelListContainer = document.getElementById('model-list');

            console.log('Got models list from backend');

            // Clear existing model list before appending new ones
            modelListContainer.innerHTML = '';

            // Dynamically generate model items
            models.forEach(model => {
                const modelItem = document.createElement('div');
                modelItem.classList.add('field-item');
                modelItem.innerHTML = `<h4>${model.name.charAt(0).toUpperCase() + model.name.slice(1)}</h4>`;
                modelItem.onclick = () => showModel(model.name);
                modelListContainer.appendChild(modelItem);
            });
        } else {
            console.log('Did not receive models list from backend');
            alert('Error loading models for this field.');
        }
    });
}
 
  // Go back to the model selection page
  function backToModelPage() {
    document.getElementById('display-page').classList.remove('active');
    document.getElementById('model-page').classList.add('active');
  }
  
  // Go back to the main field selection page
  function backToMainPage() {
    document.getElementById('model-page').classList.remove('active');
    document.getElementById('main-page').classList.add('active');
  }
  
