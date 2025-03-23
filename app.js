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
  
  // Function to send data to the backend using fetch
  function sendToBackend(data) {
    return fetch('http://localhost:5000/api/send-field-data', {  // Adjust URL based on your backend server address
      method: 'POST',  // Use POST request to send data to the backend
      headers: {
        'Content-Type': 'application/json',  // Set content type to JSON
      },
      body: JSON.stringify(data),  // Convert the data object to a JSON string
    })
    .then(response => response.json())
        .catch(error => {
          console.error('Error sending data to backend:', error);
          return { success: false, message: error.message };
        });
  }
  
  // Show models for a selected field
  function showFieldModels(field) {
    // Hide main page and show model page
    document.getElementById('main-page').classList.remove('active');
    document.getElementById('model-page').classList.add('active');
    console.log('senttobackend: %s',field);

    // Send field information to the backend to fetch available models
    sendToBackend({ field }).then(response => {
      if (response.success) {
        const models = response.models; // List of models from the backend
        const modelPage = document.getElementById('model-page');
        
        console.log('got models list from backend');
        // Dynamically generate model items based on the backend response
        modelPage.innerHTML = `
          <div class="back-button" onclick="backToMainPage()">Back to Fields</div>
          <div id="search-container">
            <input type="text" id="search-model-bar" placeholder="Search for a model..." />
            <button id="search-button" onclick="searchModel()">Search</button>
          </div>
          <h2>Available Models in ${field.charAt(0).toUpperCase() + field.slice(1)}</h2>
          ${models.map(model => `
            <div class="field-item" onclick="showModel('${model.name}', '${field}')">
              <h4>${model.name}</h4>
              <p class="field-description">${model.description}</p>
            </div>
          `).join('')}
        `;
      } else {
        console.log('did not got models list from backend');
        alert('Error loading models for this field.');
      }
    });
  }
  
  // Show the selected model and display 3D model viewer with info
  function showModel(modelName, field) {
    sendToBackend({ model: modelName, field }).then(response => {
      if (response.success) {
        // Show the model and its details on the display page
        console.log('got model and description from backend');
        document.getElementById('model-viewer').src = response.model_url;
        document.getElementById('model-description').innerText = response.description;
        document.getElementById('model-page').classList.remove('active');
        document.getElementById('display-page').classList.add('active');
      } else {
        console.log('did not got model and description from backend');
        alert('Error loading model details.');
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
  
        document.getElementById('not-found-message').style.display = found ? 'none' : 'block';
      
        // After search, go back to the main page
        document.getElementById('model-page').classList.remove('active'); // Hide model page if it is visible
        document.getElementById('main-page').classList.add('active'); // Show the main page
      }