(function() {
  // ========== DOM elements ==========
  const publicView = document.getElementById('publicView');
  const memberView = document.getElementById('memberView');
  const authModal = document.getElementById('authModal');
  const showSignupBtn = document.getElementById('showSignupBtn');
  const pricingNavBtn = document.getElementById('pricingNavBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const loggedInRoleSpan = document.getElementById('loggedInRole');
  const loggedInNameSpan = document.getElementById('loggedInName');
  const memberMenu = document.getElementById('memberMenu');

  // Modal tabs
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const loginFormDiv = document.getElementById('loginForm');
  const signupFormDiv = document.getElementById('signupForm');

  // Action buttons
  const loginActionBtn = document.getElementById('loginActionBtn');
  const signupActionBtn = document.getElementById('signupActionBtn');

  // Role radios
  const roleRadios = document.querySelectorAll('input[name="role"]');

  // Country / City
  const countrySelect = document.getElementById('countrySelect');
  const citySelect = document.getElementById('citySelect');

  // Patient panels
  const exercisePanel = document.getElementById('exercisePanel');
  const memoriesPanel = document.getElementById('memoriesPanel');
  const memoriesContainer = document.getElementById('memoriesContainer');
  const addMemoryBtn = document.getElementById('addMemoryBtn');
  // Memory modal elements
  const memoryModal = document.getElementById('memoryModal');
  const memoryTitle = document.getElementById('memoryTitle');
  const memoryDate = document.getElementById('memoryDate');
  const memoryDescription = document.getElementById('memoryDescription');
  const memoryImages = document.getElementById('memoryImages');
  const saveMemoryBtn = document.getElementById('saveMemoryBtn');
  const cancelMemoryBtn = document.getElementById('cancelMemoryBtn');

  // Video player elements (exercise)
  const patientExerciseList = document.getElementById('patientExerciseList');
  const exerciseVideoPlayer = document.getElementById('exerciseVideoPlayer');
  const currentExerciseTitle = document.getElementById('currentExerciseTitle');
  const exerciseVideoElement = document.getElementById('exerciseVideoElement');
  const currentVideoFilename = document.getElementById('currentVideoFilename');
  const videoNavControls = document.getElementById('videoNavControls');
  const exerciseVideoCounter = document.getElementById('exerciseVideoCounter');
  const prevExerciseVideoBtn = document.getElementById('prevExerciseVideoBtn');
  const nextExerciseVideoBtn = document.getElementById('nextExerciseVideoBtn');
  const backToExercisesBtn = document.getElementById('backToExercisesBtn');

  // Doctor panels
  const doctorDashboard = document.getElementById('doctorDashboardPanel');
  const doctorFeedbacks = document.getElementById('doctorFeedbacksPanel');
  const postNewExerciseBtn = document.getElementById('postNewExerciseBtn');
  const postExerciseForm = document.getElementById('postExerciseForm');
  const cancelPostBtn = document.getElementById('cancelPostBtn');
  const saveExerciseBtn = document.getElementById('saveExerciseBtn');
  const exerciseContainer = document.getElementById('exerciseContainer');
  const doctorNameInput = document.getElementById('doctorName');
  const videoUpload = document.getElementById('videoUpload');

  // ========== Global state ==========
  let currentUser = { name: '', role: '' };
  let tasks = [];  // all exercises posted by doctors
  let memories = []; // all memories for the current user
  let currentExerciseId = null;
  let currentVideoIndex = 0;

  // Load tasks from localStorage
  function loadData() {
    const storedTasks = localStorage.getItem('memorywell_tasks');
    tasks = storedTasks ? JSON.parse(storedTasks) : [];
  }
  function saveTasks() {
    const tasksToSave = tasks.map(task => {
      const { videoUrls, ...rest } = task;
      return rest;
    });
    localStorage.setItem('memorywell_tasks', JSON.stringify(tasksToSave));
  }

  // Load memories for current user
  function loadMemories() {
    if (!currentUser.name) return;
    const key = `memorywell_memories_${currentUser.name}`;
    const stored = localStorage.getItem(key);
    memories = stored ? JSON.parse(stored) : [];
  }
  function saveMemories() {
    if (!currentUser.name) return;
    const key = `memorywell_memories_${currentUser.name}`;
    // Remove object URLs before saving (they are temporary)
    const memoriesToSave = memories.map(m => {
      const { imageUrls, ...rest } = m;
      return rest;
    });
    localStorage.setItem(key, JSON.stringify(memoriesToSave));
  }

  loadData();

  // ========== UI view functions ==========
  function showPublicOnly() {
    publicView.style.display = 'block';
    memberView.classList.remove('active');
    exercisePanel.classList.remove('active');
    memoriesPanel.classList.remove('active');
    doctorDashboard.classList.remove('active');
    doctorFeedbacks.classList.remove('active');
  }

  function showMemberArea(role, name = 'User') {
    publicView.style.display = 'none';
    memberView.classList.add('active');
    authModal.classList.remove('active');

    loggedInRoleSpan.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    loggedInNameSpan.textContent = name;
    currentUser = { name, role };

    // Load memories for this user
    loadMemories();

    // Hide all panels
    exercisePanel.classList.remove('active');
    memoriesPanel.classList.remove('active');
    doctorDashboard.classList.remove('active');
    doctorFeedbacks.classList.remove('active');

    if (role === 'patient') {
      memberMenu.innerHTML = `
        <button id="showExerciseBtn">🏋️ Exercises</button>
        <button id="showMemoriesBtn">📸 Memories</button>
      `;
      exercisePanel.classList.add('active');
      showExerciseList();
      renderPatientExercises();

      document.getElementById('showExerciseBtn').addEventListener('click', () => {
        exercisePanel.classList.add('active');
        memoriesPanel.classList.remove('active');
        showExerciseList();
        renderPatientExercises();
      });
      document.getElementById('showMemoriesBtn').addEventListener('click', () => {
        memoriesPanel.classList.add('active');
        exercisePanel.classList.remove('active');
        renderMemories(); // refresh memories when switching to tab
      });
    }
    else if (role === 'doctor') {
      memberMenu.innerHTML = `
        <button id="showDoctorDashboard">📋 Post Exercise</button>
        <button id="showDoctorFeedbacks">💬 Feedbacks</button>
      `;
      doctorDashboard.classList.add('active');
      if (doctorNameInput) {
        doctorNameInput.value = name;
      }
      renderDoctorExercises();

      document.getElementById('showDoctorDashboard').addEventListener('click', () => {
        doctorDashboard.classList.add('active');
        doctorFeedbacks.classList.remove('active');
      });
      document.getElementById('showDoctorFeedbacks').addEventListener('click', () => {
        doctorFeedbacks.classList.add('active');
        doctorDashboard.classList.remove('active');
      });
    }
  }

  function showExerciseList() {
    patientExerciseList.style.display = 'block';
    exerciseVideoPlayer.style.display = 'none';
    if (exerciseVideoElement) exerciseVideoElement.pause();
  }

  function showVideoPlayer() {
    patientExerciseList.style.display = 'none';
    exerciseVideoPlayer.style.display = 'block';
  }

  // ========== Memory functions ==========
  function renderMemories() {
    if (!memoriesContainer) return;
    if (memories.length === 0) {
      memoriesContainer.innerHTML = `<p style="font-size: 2rem; text-align: center; color: #777; grid-column: 1/-1;">No memories yet. Click the button to add one.</p>`;
      return;
    }
    let html = '';
    memories.forEach((memory, index) => {
      // Use first image as preview if available
      const imagePreview = memory.imageUrls && memory.imageUrls.length > 0 
        ? `<img src="${memory.imageUrls[0]}" alt="memory" style="width:100%; height:150px; object-fit:cover; border-radius:50px;">` 
        : `<div class="photo">📸</div>`;
      html += `
        <div class="memory-card" data-memory-index="${index}">
          ${imagePreview}
          <h3>${memory.title || 'Untitled'}</h3>
          <p>${memory.date || ''}</p>
          <p>${memory.description || ''}</p>
        </div>
      `;
    });
    memoriesContainer.innerHTML = html;
  }

  // Open memory modal
  addMemoryBtn.addEventListener('click', () => {
    // Clear previous inputs
    memoryTitle.value = '';
    memoryDate.value = '';
    memoryDescription.value = '';
    memoryImages.value = '';
    memoryModal.classList.add('active');
  });

  // Cancel memory modal
  cancelMemoryBtn.addEventListener('click', () => {
    memoryModal.classList.remove('active');
  });

  // Save memory
  saveMemoryBtn.addEventListener('click', () => {
    const title = memoryTitle.value.trim() || 'Untitled';
    const date = memoryDate.value;
    const description = memoryDescription.value.trim();
    const files = memoryImages.files;

    const imageNames = [];
    const imageUrls = [];
    for (let i = 0; i < files.length; i++) {
      imageNames.push(files[i].name);
      imageUrls.push(URL.createObjectURL(files[i]));
    }

    const newMemory = {
      id: Date.now(),
      title,
      date,
      description,
      images: imageNames,
      imageUrls: imageUrls,
    };

    memories.push(newMemory);
    saveMemories();
    renderMemories();
    memoryModal.classList.remove('active');
  });

  // Close modal on outside click
  window.addEventListener('click', (e) => {
    if (e.target === memoryModal) {
      memoryModal.classList.remove('active');
    }
  });

  // ========== Patient: render exercise list ==========
  function renderPatientExercises() {
    if (!patientExerciseList) return;
    if (tasks.length === 0) {
      patientExerciseList.innerHTML = `<p style="font-size: 2rem; text-align: center; color: #777;">No Exercise available</p>`;
      return;
    }
    let html = '';
    tasks.forEach(task => {
      const videoCount = task.videos ? task.videos.length : 0;
      html += `
        <div class="exercise-card" data-task-id="${task.id}">
          <h4>🧠 ${task.title}</h4>
          <p>${task.description || 'No description'}</p>
          <div class="exercise-meta">
            <span>Doctor: ${task.doctor}</span>
            <span>📹 ${videoCount} video(s) included</span>
          </div>
          <button class="start-btn">Start Exercise</button>
        </div>
      `;
    });
    patientExerciseList.innerHTML = html;

    document.querySelectorAll('.exercise-card .start-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.exercise-card');
        const taskId = Number(card.dataset.taskId);
        startExercise(taskId);
      });
    });
  }

  // Start exercise
  function startExercise(taskId) {
    const exercise = tasks.find(t => t.id === taskId);
    if (!exercise) return;
    currentExerciseId = taskId;
    currentVideoIndex = 0;
    showVideoPlayer();
    updateExercisePlayer();
  }

  // Update video player
  function updateExercisePlayer() {
    const exercise = tasks.find(t => t.id === currentExerciseId);
    if (!exercise) return;

    currentExerciseTitle.textContent = exercise.title;

    const videos = exercise.videos || [];
    if (videos.length > 0) {
      currentVideoFilename.textContent = videos[currentVideoIndex];
      if (exercise.videoUrls && exercise.videoUrls[currentVideoIndex]) {
        exerciseVideoElement.src = exercise.videoUrls[currentVideoIndex];
        exerciseVideoElement.load();
      } else {
        exerciseVideoElement.src = '';
        currentVideoFilename.textContent += ' (video unavailable after reload)';
      }
    } else {
      currentVideoFilename.textContent = 'No video uploaded';
      exerciseVideoElement.src = '';
    }

    if (videos.length > 1) {
      videoNavControls.style.display = 'flex';
      exerciseVideoCounter.textContent = `${currentVideoIndex + 1} / ${videos.length}`;
    } else {
      videoNavControls.style.display = 'none';
    }
  }

  // Video navigation
  if (prevExerciseVideoBtn) {
    prevExerciseVideoBtn.addEventListener('click', () => {
      const exercise = tasks.find(t => t.id === currentExerciseId);
      if (!exercise) return;
      const videos = exercise.videos || [];
      if (videos.length === 0) return;
      currentVideoIndex = (currentVideoIndex - 1 + videos.length) % videos.length;
      updateExercisePlayer();
    });
  }
  if (nextExerciseVideoBtn) {
    nextExerciseVideoBtn.addEventListener('click', () => {
      const exercise = tasks.find(t => t.id === currentExerciseId);
      if (!exercise) return;
      const videos = exercise.videos || [];
      if (videos.length === 0) return;
      currentVideoIndex = (currentVideoIndex + 1) % videos.length;
      updateExercisePlayer();
    });
  }
  if (backToExercisesBtn) {
    backToExercisesBtn.addEventListener('click', () => {
      showExerciseList();
    });
  }

  // ========== Doctor functions ==========
  function renderDoctorExercises() {
    const doctorTasks = tasks.filter(t => t.doctor === currentUser.name);
    if (doctorTasks.length === 0) {
      exerciseContainer.innerHTML = '<p style="font-size: 2rem; text-align: center; color: #777;">No exercises posted yet.</p>';
      return;
    }
    let html = '';
    doctorTasks.forEach(task => {
      const videoCount = task.videos ? task.videos.length : 0;
      html += `
        <div class="exercise-card" style="background: white; border-radius: 50px; padding: 25px; margin-bottom: 20px; border: 4px solid #ffd793;">
          <div style="display: flex; justify-content: space-between;">
            <h4 style="font-size: 2.2rem;">🧠 ${task.title}</h4>
          </div>
          <p style="font-size: 1.8rem; margin: 10px 0;">${task.description || 'No description'}</p>
          <p style="font-size: 1.8rem;"><strong>Doctor:</strong> ${task.doctor}</p>
          <p style="font-size: 1.8rem;"><strong>Videos:</strong> ${videoCount} file(s)</p>
        </div>
      `;
    });
    exerciseContainer.innerHTML = html;
  }

  // ========== Event listeners ==========
  showSignupBtn.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupFormDiv.classList.add('active');
    loginFormDiv.classList.remove('active');
    authModal.classList.add('active');
  });

  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginFormDiv.classList.add('active');
    signupFormDiv.classList.remove('active');
  });

  signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupFormDiv.classList.add('active');
    loginFormDiv.classList.remove('active');
  });

  pricingNavBtn.addEventListener('click', () => {
    if (!memberView.classList.contains('active')) {
      document.getElementById('pricingSection').scrollIntoView({ behavior: 'smooth' });
    } else {
      alert('You are in the member area. Log out to see pricing.');
    }
  });

  loginActionBtn.addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value;
    let name = email.split('@')[0] || 'Demo Doctor';
    name = name.charAt(0).toUpperCase() + name.slice(1);
    showMemberArea('doctor', name);
  });

  signupActionBtn.addEventListener('click', () => {
    const name = document.getElementById('fullName').value.trim();
    if (!name) {
      alert('Please enter your name.');
      return;
    }
    let selectedRole = 'patient';
    for (let radio of roleRadios) {
      if (radio.checked) {
        selectedRole = radio.value;
        break;
      }
    }
    showMemberArea(selectedRole, name);
  });

  modalCancelBtn.addEventListener('click', () => {
    authModal.classList.remove('active');
  });

  window.addEventListener('click', (e) => {
    if (e.target === authModal) {
      authModal.classList.remove('active');
    }
  });

  logoutBtn.addEventListener('click', () => {
    showPublicOnly();
    currentUser = { name: '', role: '' };
  });

  // Country / City logic
  const citiesByCountry = {
    us: ['New York', 'Los Angeles', 'Chicago'],
    ca: ['Toronto', 'Vancouver', 'Montreal'],
    uk: ['London', 'Manchester', 'Birmingham'],
    kz: ['Almaty', 'Nur-Sultan', 'Shymkent']
  };
  function updateCityOptions(country) {
    citySelect.innerHTML = '<option value="" disabled selected>Select City</option>';
    if (country && citiesByCountry[country]) {
      citiesByCountry[country].forEach(city => {
        const option = document.createElement('option');
        option.value = city.toLowerCase().replace(/\s+/g, '');
        option.textContent = city;
        citySelect.appendChild(option);
      });
    }
  }
  countrySelect.addEventListener('change', function() {
    updateCityOptions(this.value);
  });

  // ========== Doctor: post new exercise ==========
  postNewExerciseBtn.addEventListener('click', () => {
    postExerciseForm.style.display = 'block';
  });
  cancelPostBtn.addEventListener('click', () => {
    postExerciseForm.style.display = 'none';
  });
  saveExerciseBtn.addEventListener('click', () => {
    const name = document.getElementById('exerciseName').value.trim();
    const desc = document.getElementById('exerciseDesc').value.trim();
    const doctor = currentUser.name;
    const files = videoUpload.files;

    if (!name) {
      alert('Please enter an exercise name.');
      return;
    }

    const videoNames = [];
    const videoUrls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      videoNames.push(file.name);
      const url = URL.createObjectURL(file);
      videoUrls.push(url);
    }

    const newTask = {
      id: Date.now(),
      title: name,
      description: desc,
      doctor: doctor,
      videos: videoNames,
      videoUrls: videoUrls,
      status: 'available',
    };

    tasks.push(newTask);
    saveTasks();
    renderDoctorExercises();

    postExerciseForm.style.display = 'none';
    document.getElementById('exerciseName').value = '';
    document.getElementById('exerciseDesc').value = '';
    videoUpload.value = '';
  });

  // Initial view
  showPublicOnly();
})();