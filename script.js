/**
 * ============================================================================
 * BIOMEDICAL ASSET & SPARE PARTS MANAGEMENT SCRIPT
 * ============================================================================
 */

// 1. MASTER IT & SEED CLINICAL ACCOUNTS
const INITIAL_USERS = [
  // MASTER IT ACCOUNT (Single administrator)
  {
    name: "System Administrator (You)",
    badge: "IT-ADMIN-01",
    email: "admin@biomed.local",
    password: "ChangeMe123!", // Generic starter placeholder for GitHub
    role: "IT Support"
  },
  // Sample Clinical Staff Accounts
  {
    name: "Eng. Tariq Mansoor",
    badge: "BME-101",
    email: "tariq@hospital.org",
    password: "Password123",
    role: "Biomed Staff"
  },
  {
    name: "Eng. Sarah Al-Otaibi",
    badge: "BME-LEAD",
    email: "sarah@hospital.org",
    password: "Password123",
    role: "Biomed Supervisor"
  }
];

// 2. DEFAULT INVENTORY DATA
const INITIAL_INVENTORY = [
  {
    id: 101,
    biomedTag: "BME-2026-0042",
    type: "Machine",
    name: "Defibrillator R-Series",
    identifier: "SN-ZOLL-8910",
    location: "ER - Crash Cart 1",
    status: "Approved",
    submittedBy: "Eng. Tariq Mansoor",
    notes: "Electrical safety test passed. Battery health: 98%. Approved by Eng. Sarah.",
    photoData: null,
    pdfData: null,
    pdfName: null
  },
  {
    id: 102,
    biomedTag: "BME-2026-0118",
    type: "Machine",
    name: "Mechanical Ventilator",
    identifier: "SN-HAM-44021",
    location: "Biomed Workshop - Bench 2",
    status: "Pending",
    submittedBy: "Eng. Tariq Mansoor",
    notes: "Intake calibration needed before deployment to ICU.",
    photoData: null,
    pdfData: null,
    pdfName: null
  },
  {
    id: 103,
    biomedTag: "PRT-VALV-003",
    type: "Part",
    name: "Expiratory Valve Set",
    identifier: "SKU-VALV-HAM6",
    location: "Biomed Store - Rack B, Bin 04",
    status: "Pending",
    submittedBy: "Eng. Tariq Mansoor",
    notes: "Received batch of 4 spare units from OEM.",
    photoData: null,
    pdfData: null,
    pdfName: null
  },
  {
    id: 104,
    biomedTag: "BME-2025-0980",
    type: "Machine",
    name: "Infusion Syringe Pump",
    identifier: "SN-BB-11029",
    location: "Biomed Staging Area",
    status: "Needs Clarification",
    submittedBy: "Eng. Tariq Mansoor",
    notes: "Supervisor Note: Serial number tag illegible. Please inspect internal chassis label.",
    photoData: null,
    pdfData: null,
    pdfName: null
  }
];

// 3. GLOBAL STATE
let users = JSON.parse(localStorage.getItem("biomed_users")) || INITIAL_USERS;
let inventory = JSON.parse(localStorage.getItem("biomed_inventory_db")) || INITIAL_INVENTORY;
let currentUser = JSON.parse(localStorage.getItem("biomed_active_session")) || null;
let activeClarifyItemId = null;

// Temporary attachment holders
let currentPhotoBase64 = null;
let currentPdfBase64 = null;
let currentPdfFileName = null;
let liveVideoStream = null;

// 4. DOM REFERENCES
const authScreen = document.getElementById("authScreen");
const mainApp = document.getElementById("mainApp");
const tabLoginBtn = document.getElementById("tabLoginBtn");
const tabSignupBtn = document.getElementById("tabSignupBtn");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authAlert = document.getElementById("authAlert");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const signupName = document.getElementById("signupName");
const signupBadge = document.getElementById("signupBadge");
const signupRole = document.getElementById("signupRole");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const signupConfirmPassword = document.getElementById("signupConfirmPassword");

const userBadge = document.getElementById("userBadge");
const logoutBtn = document.getElementById("logoutBtn");
const itAdminBanner = document.getElementById("itAdminBanner");
const biomedActionButtons = document.getElementById("biomedActionButtons");

const inventoryTableBody = document.getElementById("inventoryTableBody");
const emptyNotice = document.getElementById("emptyNotice");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const kpiMachines = document.getElementById("kpiMachines");
const kpiParts = document.getElementById("kpiParts");
const kpiPending = document.getElementById("kpiPending");

// Modals: Add / Edit Item
const itemModal = document.getElementById("itemModal");
const itemForm = document.getElementById("itemForm");
const formItemType = document.getElementById("formItemType");
const editItemId = document.getElementById("editItemId");
const modalTitle = document.getElementById("modalTitle");
const inputBiomedTag = document.getElementById("inputBiomedTag");
const lblItemName = document.getElementById("lblItemName");
const lblIdentifier = document.getElementById("lblIdentifier");
const inputName = document.getElementById("inputName");
const inputIdentifier = document.getElementById("inputIdentifier");
const inputLocation = document.getElementById("inputLocation");
const inputRemarks = document.getElementById("inputRemarks");

// Camera & Upload Triggers
const lblPhotoUpload = document.getElementById("lblPhotoUpload");
const btnTriggerCamera = document.getElementById("btnTriggerCamera");
const btnTriggerGallery = document.getElementById("btnTriggerGallery");
const inputCameraCapture = document.getElementById("inputCameraCapture");
const inputPhoto = document.getElementById("inputPhoto");
const photoPreviewContainer = document.getElementById("photoPreviewContainer");
const photoPreviewImg = document.getElementById("photoPreviewImg");
const removePhotoBtn = document.getElementById("removePhotoBtn");

// Live Webcam Modal
const liveCameraModal = document.getElementById("liveCameraModal");
const cameraVideo = document.getElementById("cameraVideo");
const cameraCanvas = document.getElementById("cameraCanvas");
const btnCaptureShutter = document.getElementById("btnCaptureShutter");
const btnCancelCamera = document.getElementById("btnCancelCamera");
const closeLiveCameraBtn = document.getElementById("closeLiveCameraBtn");

// PDF Uploads
const pdfUploadGroup = document.getElementById("pdfUploadGroup");
const inputPdf = document.getElementById("inputPdf");
const pdfPreviewContainer = document.getElementById("pdfPreviewContainer");
const pdfFileName = document.getElementById("pdfFileName");
const removePdfBtn = document.getElementById("removePdfBtn");

// Details / Dossier Modal
const assetDetailModal = document.getElementById("assetDetailModal");
const detailTypeBadge = document.getElementById("detailTypeBadge");
const detailAssetName = document.getElementById("detailAssetName");
const detailBiomedTag = document.getElementById("detailBiomedTag");
const detailIdentifier = document.getElementById("detailIdentifier");
const detailLocation = document.getElementById("detailLocation");
const detailStatusContainer = document.getElementById("detailStatusContainer");
const detailSubmittedBy = document.getElementById("detailSubmittedBy");
const detailNotes = document.getElementById("detailNotes");
const detailPhotoContainer = document.getElementById("detailPhotoContainer");
const detailPdfCard = document.getElementById("detailPdfCard");
const detailPdfContainer = document.getElementById("detailPdfContainer");
const detailModalFooter = document.getElementById("detailModalFooter");
const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");
const closeDetailModalBottomBtn = document.getElementById("closeDetailModalBottomBtn");

// Lightbox Viewer
const imageViewerModal = document.getElementById("imageViewerModal");
const imageViewerTitle = document.getElementById("imageViewerTitle");
const imageViewerImg = document.getElementById("imageViewerImg");
const closeImageViewerBtn = document.getElementById("closeImageViewerBtn");

// Clarification Modal
const clarifyModal = document.getElementById("clarifyModal");
const clarifyNoteInput = document.getElementById("clarifyNoteInput");

// IT Modals
const accountsModal = document.getElementById("accountsModal");
const accountsTableBody = document.getElementById("accountsTableBody");
const itUserEditModal = document.getElementById("itUserEditModal");
const itUserEditForm = document.getElementById("itUserEditForm");
const itEditUserOriginalEmail = document.getElementById("itEditUserOriginalEmail");
const itEditName = document.getElementById("itEditName");
const itEditBadge = document.getElementById("itEditBadge");
const itEditRole = document.getElementById("itEditRole");
const itEditEmail = document.getElementById("itEditEmail");
const itEditPassword = document.getElementById("itEditPassword");

// 5. STORAGE HELPERS
function saveUsers() {
  localStorage.setItem("biomed_users", JSON.stringify(users));
}
function saveInventory() {
  try {
    localStorage.setItem("biomed_inventory_db", JSON.stringify(inventory));
  } catch (err) {
    alert("⚠️ Browser storage is nearly full. Please take lower resolution photos or upload smaller PDFs (under 1MB).");
  }
}
function saveActiveSession() {
  localStorage.setItem("biomed_active_session", JSON.stringify(currentUser));
}

// 6. AUTHENTICATION
function showAuthAlert(message, type = "error") {
  if (!authAlert) return;
  authAlert.textContent = message;
  authAlert.className = `auth-alert ${type}`;
  authAlert.classList.remove("hidden");
}
function clearAuthAlert() {
  if (!authAlert) return;
  authAlert.textContent = "";
  authAlert.classList.add("hidden");
}

if (tabLoginBtn && tabSignupBtn) {
  tabLoginBtn.addEventListener("click", () => {
    tabLoginBtn.classList.add("active");
    tabSignupBtn.classList.remove("active");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    clearAuthAlert();
  });

  tabSignupBtn.addEventListener("click", () => {
    tabSignupBtn.classList.add("active");
    tabLoginBtn.classList.remove("active");
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    clearAuthAlert();
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAuthAlert();

    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value.trim();
    const user = users.find(u => u.email.toLowerCase() === email && u.password === password);

    if (user) {
      currentUser = {
        name: user.name,
        badge: user.badge,
        email: user.email,
        role: user.role
      };
      saveActiveSession();
      loginForm.reset();
      launchMainApp();
    } else {
      showAuthAlert("Invalid email or password. Please verify credentials with IT.", "error");
    }
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAuthAlert();

    const name = signupName.value.trim();
    const badge = signupBadge.value.trim().toUpperCase();
    const role = signupRole.value;
    const email = signupEmail.value.trim().toLowerCase();
    const password = signupPassword.value.trim();
    const confirmPassword = signupConfirmPassword.value.trim();

    if (password.length < 6) {
      showAuthAlert("Password must be at least 6 characters.", "error");
      return;
    }
    if (password !== confirmPassword) {
      showAuthAlert("Passwords do not match.", "error");
      return;
    }
    if (users.find(u => u.email.toLowerCase() === email)) {
      showAuthAlert("Email already registered.", "error");
      return;
    }

    users.push({ name, badge, role, email, password });
    saveUsers();
    signupForm.reset();
    showAuthAlert("Account created successfully! You can now sign in.", "success");
    tabLoginBtn.click();
    loginEmail.value = email;
  });
}

// Quick Demo shortcuts: Clinical roles only (IT demo removed)
window.fillDemo = function(roleKey) {
  if (tabLoginBtn) tabLoginBtn.click();
  if (roleKey === "staff") {
    loginEmail.value = "tariq@hospital.org";
    loginPassword.value = "Password123";
  } else if (roleKey === "supervisor") {
    loginEmail.value = "sarah@hospital.org";
    loginPassword.value = "Password123";
  }
};

function launchMainApp() {
  if (authScreen) authScreen.classList.add("hidden");
  if (mainApp) mainApp.classList.remove("hidden");
  renderUserSession();
  renderTable();
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    currentUser = null;
    localStorage.removeItem("biomed_active_session");
    mainApp.classList.add("hidden");
    authScreen.classList.remove("hidden");
    clearAuthAlert();
  });
}

// 7. USER SESSION & ROLES
function renderUserSession() {
  if (!currentUser || !userBadge) return;

  let icon = "🧰";
  if (currentUser.role === "Biomed Supervisor") icon = "🛡️";
  if (currentUser.role === "IT Support") icon = "💻";

  userBadge.innerHTML = `
    <span>${icon}</span>
    <span><strong>${currentUser.name}</strong> [${currentUser.badge}] (${currentUser.role})</span>
  `;

  if (currentUser.role === "IT Support") {
    if (itAdminBanner) itAdminBanner.classList.remove("hidden");
    if (biomedActionButtons) biomedActionButtons.classList.add("hidden");
  } else {
    if (itAdminBanner) itAdminBanner.classList.add("hidden");
    if (biomedActionButtons) biomedActionButtons.classList.remove("hidden");
  }
}

// 8. TABLE RENDERING WITH DETAILS & ATTACHMENTS
function updateKPIs() {
  if (!kpiMachines || !kpiParts || !kpiPending) return;
  kpiMachines.textContent = inventory.filter(i => i.type === "Machine").length;
  kpiParts.textContent = inventory.filter(i => i.type === "Part").length;
  kpiPending.textContent = inventory.filter(i => i.status === "Pending").length;
}

function renderTable() {
  if (!inventoryTableBody) return;
  const query = (searchInput ? searchInput.value : "").toLowerCase().trim();
  const filter = statusFilter ? statusFilter.value : "ALL";

  inventoryTableBody.innerHTML = "";

  const filteredList = inventory.filter(item => {
    const matchesQuery =
      (item.biomedTag && item.biomedTag.toLowerCase().includes(query)) ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.identifier && item.identifier.toLowerCase().includes(query)) ||
      (item.location && item.location.toLowerCase().includes(query));

    const matchesStatus = (filter === "ALL" || item.status === filter);
    return matchesQuery && matchesStatus;
  });

  if (emptyNotice) {
    emptyNotice.classList.toggle("hidden", filteredList.length > 0);
  }

  filteredList.forEach(item => {
    const tr = document.createElement("tr");

    let statusClass = "badge-pending";
    if (item.status === "Approved") statusClass = "badge-approved";
    if (item.status === "Needs Clarification") statusClass = "badge-clarification";

    const typeClass = item.type === "Machine" ? "badge-machine" : "badge-part";

    let attachmentsHtml = `<div class="attachment-container">`;
    if (item.photoData) {
      attachmentsHtml += `
        <button class="btn-file-chip" onclick="openPhotoViewer('${item.id}')" title="Zoom in on photo">
          📷 Photo
        </button>
      `;
    }
    if (item.pdfData && item.type === "Machine") {
      attachmentsHtml += `
        <button class="btn-file-chip pdf" onclick="openPdfReport('${item.id}')" title="Open calibration PDF report">
          📑 PDF
        </button>
      `;
    }
    if (!item.photoData && !item.pdfData) {
      attachmentsHtml += `<span style="color:var(--text-muted); font-size:0.75rem;">None</span>`;
    }
    attachmentsHtml += `</div>`;

    let actionHtml = "";
    if (currentUser && currentUser.role === "Biomed Supervisor") {
      actionHtml = `
        <div style="text-align: right; display: flex; justify-content: flex-end; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
          <button class="btn btn-sm btn-outline" onclick="openAssetDetailModal(${item.id})">👁️ View</button>
          <button class="btn btn-sm btn-approve" onclick="handleApprove(${item.id})">✅ Approve</button>
          <button class="btn btn-sm btn-clarify" onclick="openClarifyModal(${item.id})">💬 Clarify</button>
          <button class="btn btn-sm btn-outline" onclick="openEditModal(${item.id})">✏️ Edit</button>
        </div>
      `;
    } else if (currentUser && currentUser.role === "IT Support") {
      actionHtml = `
        <div style="text-align: right; display: flex; justify-content: flex-end; align-items: center; gap: 0.35rem;">
          <button class="btn btn-sm btn-outline" onclick="openAssetDetailModal(${item.id})">👁️ View</button>
          <span class="badge badge-locked" style="background:#faf5ff; color:var(--it-accent);">💻 IT Read-Only</span>
        </div>
      `;
    } else {
      actionHtml = `
        <div style="text-align: right; display: flex; justify-content: flex-end; align-items: center; gap: 0.35rem;">
          <button class="btn btn-sm btn-outline" onclick="openAssetDetailModal(${item.id})">👁️ View</button>
          <span class="badge badge-locked">🔒 Awaiting Supervisor</span>
          <button class="btn btn-sm btn-outline" onclick="openEditModal(${item.id})">✏️ Edit</button>
        </div>
      `;
    }

    tr.innerHTML = `
      <td>
        <span class="badge-biomed-tag" onclick="openAssetDetailModal(${item.id})" title="Click to view full dossier">
          🏷️ ${item.biomedTag || "NO TAG"}
        </span>
      </td>
      <td><span class="badge ${typeClass}">${item.type}</span></td>
      <td>
        <strong class="clickable-asset-title" onclick="openAssetDetailModal(${item.id})" title="Click to view details">
          ${item.name}
        </strong>
        <span class="item-notes">${item.notes || "No technical notes."}</span>
      </td>
      <td>${attachmentsHtml}</td>
      <td><code>${item.identifier}</code></td>
      <td>${item.location}</td>
      <td>
        <span class="badge ${statusClass}">${item.status}</span>
        <span class="item-notes">Sub by: ${item.submittedBy}</span>
      </td>
      <td>${actionHtml}</td>
    `;

    inventoryTableBody.appendChild(tr);
  });

  updateKPIs();
}

// 9. SUPERVISOR ACTIONS
window.handleApprove = function(id) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;
  item.status = "Approved";
  item.notes = `Verified & approved by ${currentUser.name} on ${new Date().toLocaleDateString()}`;
  saveInventory();
  renderTable();
  if (!assetDetailModal.classList.contains("hidden")) {
    openAssetDetailModal(id);
  }
};

window.openClarifyModal = function(id) {
  activeClarifyItemId = id;
  if (clarifyNoteInput) clarifyNoteInput.value = "";
  if (clarifyModal) clarifyModal.classList.remove("hidden");
};

const submitClarifyBtn = document.getElementById("submitClarifyBtn");
if (submitClarifyBtn) {
  submitClarifyBtn.addEventListener("click", () => {
    const note = clarifyNoteInput.value.trim();
    if (!note) {
      alert("Please enter a clarification note.");
      return;
    }
    const item = inventory.find(i => i.id === activeClarifyItemId);
    if (item) {
      item.status = "Needs Clarification";
      item.notes = `Supervisor Note: ${note}`;
      saveInventory();
      renderTable();
      if (!assetDetailModal.classList.contains("hidden")) {
        openAssetDetailModal(item.id);
      }
    }
    if (clarifyModal) clarifyModal.classList.add("hidden");
  });
}

// 10. ASSET DETAILS DOSSIER MODAL
window.openAssetDetailModal = function(id) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;

  detailTypeBadge.className = `badge ${item.type === "Machine" ? "badge-machine" : "badge-part"}`;
  detailTypeBadge.textContent = item.type;
  detailAssetName.textContent = item.name;

  detailBiomedTag.textContent = item.biomedTag || "N/A";
  detailIdentifier.textContent = item.identifier || "N/A";
  detailLocation.textContent = item.location || "N/A";
  detailSubmittedBy.textContent = item.submittedBy || "System";
  detailNotes.textContent = item.notes || "No technical remarks provided.";

  let statusClass = "badge-pending";
  if (item.status === "Approved") statusClass = "badge-approved";
  if (item.status === "Needs Clarification") statusClass = "badge-clarification";
  detailStatusContainer.innerHTML = `<span class="badge ${statusClass}">${item.status}</span>`;

  if (item.photoData) {
    detailPhotoContainer.innerHTML = `
      <img src="${item.photoData}" alt="${item.name}" class="media-thumb-img" onclick="openPhotoViewer('${item.id}')" title="Click to enlarge" />
      <button class="btn btn-sm btn-outline" style="margin-top:0.5rem;" onclick="openPhotoViewer('${item.id}')">🔍 Enlarge Photo</button>
    `;
  } else {
    detailPhotoContainer.innerHTML = `<span class="no-media-msg">No equipment photo uploaded.</span>`;
  }

  if (item.type === "Machine") {
    detailPdfCard.classList.remove("hidden");
    if (item.pdfData) {
      detailPdfContainer.innerHTML = `
        <div class="pdf-preview-box">
          <span class="pdf-icon-lg">📑</span>
          <strong style="font-size:0.85rem; color:#2d3748; word-break:break-all;">${item.pdfName || "Calibration_Report.pdf"}</strong>
          <button class="btn btn-sm btn-primary" onclick="openPdfReport('${item.id}')">📖 Open / Print PDF</button>
        </div>
      `;
    } else {
      detailPdfContainer.innerHTML = `<span class="no-media-msg">No calibration/service PDF uploaded.</span>`;
    }
  } else {
    detailPdfCard.classList.add("hidden");
  }

  let footerHtml = `
    <button type="button" class="btn btn-outline" onclick="closeDetailModal()">Close</button>
  `;

  if (currentUser && currentUser.role === "Biomed Supervisor") {
    footerHtml = `
      <button type="button" class="btn btn-outline" onclick="openEditModal(${item.id})">✏️ Edit Details</button>
      <button type="button" class="btn btn-warning" onclick="openClarifyModal(${item.id})">💬 Clarify</button>
      <button type="button" class="btn btn-approve" onclick="handleApprove(${item.id})">✅ Approve Equipment</button>
      <button type="button" class="btn btn-outline" onclick="closeDetailModal()">Close</button>
    `;
  } else if (currentUser && currentUser.role === "Biomed Staff") {
    footerHtml = `
      <button type="button" class="btn btn-outline" onclick="openEditModal(${item.id})">✏️ Edit Asset</button>
      <button type="button" class="btn btn-outline" onclick="closeDetailModal()">Close</button>
    `;
  }

  detailModalFooter.innerHTML = footerHtml;
  assetDetailModal.classList.remove("hidden");
};

function closeDetailModal() {
  assetDetailModal.classList.add("hidden");
}

if (closeDetailModalBtn) closeDetailModalBtn.addEventListener("click", closeDetailModal);
if (closeDetailModalBottomBtn) closeDetailModalBottomBtn.addEventListener("click", closeDetailModal);

// 11. MOBILE CAMERA & FILE UPLOAD SYSTEM
function processAndSetImage(file) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      const MAX_DIM = 1000;

      if (width > height && width > MAX_DIM) {
        height = Math.round((height * MAX_DIM) / width);
        width = MAX_DIM;
      } else if (height > MAX_DIM) {
        width = Math.round((width * MAX_DIM) / height);
        height = MAX_DIM;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      currentPhotoBase64 = canvas.toDataURL("image/jpeg", 0.75);
      photoPreviewImg.src = currentPhotoBase64;
      photoPreviewContainer.classList.remove("hidden");
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
}

if (btnTriggerCamera) {
  btnTriggerCamera.addEventListener("click", () => {
    if (isMobileDevice() || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      inputCameraCapture.click();
    } else {
      startDesktopLiveCamera();
    }
  });
}

if (btnTriggerGallery) {
  btnTriggerGallery.addEventListener("click", () => {
    inputPhoto.click();
  });
}

if (inputCameraCapture) {
  inputCameraCapture.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) processAndSetImage(file);
  });
}

if (inputPhoto) {
  inputPhoto.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) processAndSetImage(file);
  });
}

if (removePhotoBtn) {
  removePhotoBtn.addEventListener("click", () => {
    currentPhotoBase64 = null;
    inputPhoto.value = "";
    inputCameraCapture.value = "";
    photoPreviewContainer.classList.add("hidden");
    photoPreviewImg.src = "";
  });
}

function startDesktopLiveCamera() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
    .then((stream) => {
      liveVideoStream = stream;
      cameraVideo.srcObject = stream;
      liveCameraModal.classList.remove("hidden");
    })
    .catch((err) => {
      alert("Unable to access camera or webcam: " + err.message);
    });
}

function stopDesktopLiveCamera() {
  if (liveVideoStream) {
    liveVideoStream.getTracks().forEach(track => track.stop());
    liveVideoStream = null;
  }
  cameraVideo.srcObject = null;
  liveCameraModal.classList.add("hidden");
}

if (btnCancelCamera) btnCancelCamera.addEventListener("click", stopDesktopLiveCamera);
if (closeLiveCameraBtn) closeLiveCameraBtn.addEventListener("click", stopDesktopLiveCamera);

if (btnCaptureShutter) {
  btnCaptureShutter.addEventListener("click", () => {
    if (!cameraVideo.videoWidth) return;

    cameraCanvas.width = cameraVideo.videoWidth;
    cameraCanvas.height = cameraVideo.videoHeight;
    const ctx = cameraCanvas.getContext("2d");
    ctx.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);

    currentPhotoBase64 = cameraCanvas.toDataURL("image/jpeg", 0.75);
    photoPreviewImg.src = currentPhotoBase64;
    photoPreviewContainer.classList.remove("hidden");

    stopDesktopLiveCamera();
  });
}

// PDF File Input Listener (Machines Only)
if (inputPdf) {
  inputPdf.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF documents are allowed for calibration reports.");
      inputPdf.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("PDF report is too large! Please choose a document under 2MB.");
      inputPdf.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      currentPdfBase64 = event.target.result;
      currentPdfFileName = file.name;
      pdfFileName.textContent = file.name;
      pdfPreviewContainer.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });
}

if (removePdfBtn) {
  removePdfBtn.addEventListener("click", () => {
    currentPdfBase64 = null;
    currentPdfFileName = null;
    inputPdf.value = "";
    pdfPreviewContainer.classList.add("hidden");
    pdfFileName.textContent = "";
  });
}

// Lightbox Viewer
window.openPhotoViewer = function(id) {
  const item = inventory.find(i => String(i.id) === String(id));
  if (!item || !item.photoData) return;

  imageViewerTitle.textContent = `${item.biomedTag || item.name} - Photo`;
  imageViewerImg.src = item.photoData;
  imageViewerModal.classList.remove("hidden");
};

if (closeImageViewerBtn) {
  closeImageViewerBtn.addEventListener("click", () => imageViewerModal.classList.add("hidden"));
}

// PDF New-Tab Viewer
window.openPdfReport = function(id) {
  const item = inventory.find(i => String(i.id) === String(id));
  if (!item || !item.pdfData) return;

  const pdfWindow = window.open("");
  pdfWindow.document.write(`
    <title>${item.pdfName || "Service Report"}</title>
    <body style="margin:0; background:#2d3748;">
      <iframe src="${item.pdfData}" frameborder="0" style="border:none; width:100%; height:100vh;"></iframe>
    </body>
  `);
};

// 12. EDIT & ADD ASSET MODAL
function resetModalAttachments() {
  currentPhotoBase64 = null;
  currentPdfBase64 = null;
  currentPdfFileName = null;

  if (inputPhoto) inputPhoto.value = "";
  if (inputCameraCapture) inputCameraCapture.value = "";
  if (inputPdf) inputPdf.value = "";

  if (photoPreviewContainer) photoPreviewContainer.classList.add("hidden");
  if (pdfPreviewContainer) pdfPreviewContainer.classList.add("hidden");

  if (photoPreviewImg) photoPreviewImg.src = "";
  if (pdfFileName) pdfFileName.textContent = "";
}

window.openEditModal = function(id) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;

  resetModalAttachments();
  closeDetailModal();

  if (editItemId) editItemId.value = item.id;
  if (formItemType) formItemType.value = item.type;

  if (modalTitle) modalTitle.textContent = `✏️ Edit ${item.type}: ${item.biomedTag || item.name}`;
  if (inputBiomedTag) inputBiomedTag.value = item.biomedTag || "";
  if (inputName) inputName.value = item.name || "";
  if (inputIdentifier) inputIdentifier.value = item.identifier || "";
  if (inputLocation) inputLocation.value = item.location || "";
  if (inputRemarks) inputRemarks.value = item.notes || "";

  if (item.type === "Machine") {
    if (lblItemName) lblItemName.textContent = "Machine / Model Name";
    if (lblIdentifier) lblIdentifier.textContent = "Factory Serial Number (SN)";
    if (lblPhotoUpload) lblPhotoUpload.textContent = "📷 Machine Photo";
    if (pdfUploadGroup) pdfUploadGroup.classList.remove("hidden");
  } else {
    if (lblItemName) lblItemName.textContent = "Part Description";
    if (lblIdentifier) lblIdentifier.textContent = "Part SKU / Code";
    if (lblPhotoUpload) lblPhotoUpload.textContent = "📷 Spare Part Photo";
    if (pdfUploadGroup) pdfUploadGroup.classList.add("hidden");
  }

  if (item.photoData) {
    currentPhotoBase64 = item.photoData;
    photoPreviewImg.src = item.photoData;
    photoPreviewContainer.classList.remove("hidden");
  }

  if (item.pdfData && item.type === "Machine") {
    currentPdfBase64 = item.pdfData;
    currentPdfFileName = item.pdfName || "report.pdf";
    pdfFileName.textContent = currentPdfFileName;
    pdfPreviewContainer.classList.remove("hidden");
  }

  if (itemModal) itemModal.classList.remove("hidden");
};

const btnAddMachine = document.getElementById("btnAddMachine");
if (btnAddMachine) {
  btnAddMachine.addEventListener("click", () => {
    resetModalAttachments();
    if (editItemId) editItemId.value = "";
    if (formItemType) formItemType.value = "Machine";
    if (modalTitle) modalTitle.textContent = "➕ Register New Biomedical Machine";
    if (inputBiomedTag) inputBiomedTag.placeholder = "e.g., BME-2026-0155";
    if (lblItemName) lblItemName.textContent = "Machine / Model Name";
    if (lblIdentifier) lblIdentifier.textContent = "Factory Serial Number (SN)";
    if (inputIdentifier) inputIdentifier.placeholder = "e.g., SN-88341";
    if (lblPhotoUpload) lblPhotoUpload.textContent = "📷 Machine Photo";
    if (pdfUploadGroup) pdfUploadGroup.classList.remove("hidden");
    if (itemForm) itemForm.reset();
    if (itemModal) itemModal.classList.remove("hidden");
  });
}

const btnAddPart = document.getElementById("btnAddPart");
if (btnAddPart) {
  btnAddPart.addEventListener("click", () => {
    resetModalAttachments();
    if (editItemId) editItemId.value = "";
    if (formItemType) formItemType.value = "Part";
    if (modalTitle) modalTitle.textContent = "🔩 Register New Spare Part";
    if (inputBiomedTag) inputBiomedTag.placeholder = "e.g., PRT-BAT-009";
    if (lblItemName) lblItemName.textContent = "Part Description";
    if (lblIdentifier) lblIdentifier.textContent = "Part SKU / Code";
    if (inputIdentifier) inputIdentifier.placeholder = "e.g., SKU-FLT-02";
    if (lblPhotoUpload) lblPhotoUpload.textContent = "📷 Spare Part Photo";
    if (pdfUploadGroup) pdfUploadGroup.classList.add("hidden");
    if (itemForm) itemForm.reset();
    if (itemModal) itemModal.classList.remove("hidden");
  });
}

if (itemForm) {
  itemForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const idToEdit = editItemId ? editItemId.value : "";
    const itemType = formItemType.value;

    if (idToEdit) {
      const idx = inventory.findIndex(i => i.id === Number(idToEdit));
      if (idx !== -1) {
        inventory[idx].biomedTag = inputBiomedTag.value.trim().toUpperCase();
        inventory[idx].name = inputName.value.trim();
        inventory[idx].identifier = inputIdentifier.value.trim();
        inventory[idx].location = inputLocation.value.trim();
        inventory[idx].notes = inputRemarks.value.trim();
        inventory[idx].photoData = currentPhotoBase64;
        inventory[idx].pdfData = itemType === "Machine" ? currentPdfBase64 : null;
        inventory[idx].pdfName = itemType === "Machine" ? currentPdfFileName : null;

        if (currentUser && currentUser.role !== "Biomed Supervisor") {
          inventory[idx].status = "Pending";
        }
      }
    } else {
      const newItem = {
        id: Date.now(),
        biomedTag: inputBiomedTag.value.trim().toUpperCase(),
        type: itemType,
        name: inputName.value.trim(),
        identifier: inputIdentifier.value.trim(),
        location: inputLocation.value.trim(),
        status: "Pending",
        submittedBy: currentUser ? currentUser.name : "Biomed Staff",
        notes: inputRemarks.value.trim() || "Awaiting supervisor verification.",
        photoData: currentPhotoBase64,
        pdfData: itemType === "Machine" ? currentPdfBase64 : null,
        pdfName: itemType === "Machine" ? currentPdfFileName : null
      };
      inventory.unshift(newItem);
    }

    saveInventory();
    if (itemModal) itemModal.classList.add("hidden");
    renderTable();
  });
}

// Modal Close Handlers
const closeItemModalBtn = document.getElementById("closeItemModalBtn");
const cancelItemModalBtn = document.getElementById("cancelItemModalBtn");
if (closeItemModalBtn) closeItemModalBtn.addEventListener("click", () => itemModal.classList.add("hidden"));
if (cancelItemModalBtn) cancelItemModalBtn.addEventListener("click", () => itemModal.classList.add("hidden"));

const closeClarifyModalBtn = document.getElementById("closeClarifyModalBtn");
const cancelClarifyBtn = document.getElementById("cancelClarifyBtn");
if (closeClarifyModalBtn) closeClarifyModalBtn.addEventListener("click", () => clarifyModal.classList.add("hidden"));
if (cancelClarifyBtn) cancelClarifyBtn.addEventListener("click", () => clarifyModal.classList.add("hidden"));

// 13. IT SYSTEM SUPPORT & ACCOUNT MANAGEMENT
window.exportDatabaseBackup = function() {
  const data = {
    backupDate: new Date().toISOString(),
    usersCount: users.length,
    inventoryCount: inventory.length,
    usersData: users,
    inventoryData: inventory
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const a = document.createElement("a");
  a.setAttribute("href", dataStr);
  a.setAttribute("download", `biomed_backup_${Date.now()}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
};

window.runSystemDiagnostics = function() {
  alert(`⚡ IT Diagnostics:\n• LocalStorage DB Status: OK\n• Registered Users: ${users.length}\n• Inventory Records: ${inventory.length}`);
};

window.openAccountsModal = function() {
  if (!accountsTableBody || !accountsModal) return;
  accountsTableBody.innerHTML = "";
  users.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${u.name}</strong></td>
      <td><code>${u.badge}</code></td>
      <td>${u.email}</td>
      <td><span class="badge" style="background:#edf2f7; color:#2d3748;">${u.role}</span></td>
      <td style="text-align: right;">
        <button class="btn btn-sm btn-outline" onclick="openItUserEditModal('${u.email}')">✏️ Edit / Reset Pass</button>
      </td>
    `;
    accountsTableBody.appendChild(tr);
  });
  accountsModal.classList.remove("hidden");
};

window.openItUserEditModal = function(email) {
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return;

  if (itEditUserOriginalEmail) itEditUserOriginalEmail.value = user.email;
  if (itEditName) itEditName.value = user.name;
  if (itEditBadge) itEditBadge.value = user.badge;
  if (itEditRole) itEditRole.value = user.role;
  if (itEditEmail) itEditEmail.value = user.email;
  if (itEditPassword) itEditPassword.value = user.password;

  if (itUserEditModal) itUserEditModal.classList.remove("hidden");
};

const closeAccountsModalBtn = document.getElementById("closeAccountsModalBtn");
const closeAccountsBtn = document.getElementById("closeAccountsBtn");
if (closeAccountsModalBtn) closeAccountsModalBtn.addEventListener("click", () => accountsModal.classList.add("hidden"));
if (closeAccountsBtn) closeAccountsBtn.addEventListener("click", () => accountsModal.classList.add("hidden"));

const closeItUserEditModalBtn = document.getElementById("closeItUserEditModalBtn");
const cancelItUserEditBtn = document.getElementById("cancelItUserEditBtn");
if (closeItUserEditModalBtn) closeItUserEditModalBtn.addEventListener("click", () => itUserEditModal.classList.add("hidden"));
if (cancelItUserEditBtn) cancelItUserEditBtn.addEventListener("click", () => itUserEditModal.classList.add("hidden"));

if (itUserEditForm) {
  itUserEditForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const originalEmail = itEditUserOriginalEmail.value.toLowerCase();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === originalEmail);

    if (userIndex !== -1) {
      users[userIndex].name = itEditName.value.trim();
      users[userIndex].badge = itEditBadge.value.trim().toUpperCase();
      users[userIndex].role = itEditRole.value;
      users[userIndex].email = itEditEmail.value.trim().toLowerCase();
      users[userIndex].password = itEditPassword.value.trim();

      saveUsers();
      alert(`Account for ${users[userIndex].name} updated successfully!`);
      if (itUserEditModal) itUserEditModal.classList.add("hidden");
      openAccountsModal();
    }
  });
}

// 14. SEARCH & FILTER
if (searchInput) searchInput.addEventListener("input", renderTable);
if (statusFilter) statusFilter.addEventListener("change", renderTable);

// 15. AUTO-LAUNCH IF PREVIOUS SESSION EXISTS
if (currentUser) {
  launchMainApp();
}