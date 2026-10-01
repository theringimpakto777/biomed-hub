/**
 * ============================================================================
 * BIOMEDICAL ASSET & SPARE PARTS MANAGEMENT (FIREBASE CLOUD INTEGRATION)
 * ============================================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  updateDoc,
  query,
  where,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. FIREBASE CONFIGURATION (biomed-hub-b028c)
const firebaseConfig = {
  apiKey: "AIzaSyCkBywEWXulan24XfxeQWRUuEG9VxmEMVc",
  authDomain: "biomed-hub-b028c.firebaseapp.com",
  projectId: "biomed-hub-b028c",
  storageBucket: "biomed-hub-b028c.firebasestorage.app",
  messagingSenderId: "422713800578",
  appId: "1:422713800578:web:c605e6d86e4fe920a0819b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const INTERNAL_DOMAIN = "@hospital.internal";

// Helper to convert Badge ID to silent internal Firebase identity
function badgeToInternalEmail(badge) {
  const cleaned = (badge || "").trim().toLowerCase().replace(/\s+/g, "");
  return cleaned.includes("@") ? cleaned : `${cleaned}${INTERNAL_DOMAIN}`;
}

// 2. GLOBAL STATE
let inventory = [];
let allUsers = [];
let allInvites = [];
let currentUser = null;
let activeClarifyItemId = null;

let currentPhotoBase64 = null;
let currentPdfBase64 = null;
let currentPdfFileName = null;
let liveVideoStream = null;

// 3. DOM ELEMENTS
const authScreen = document.getElementById("authScreen");
const mainApp = document.getElementById("mainApp");
const tabLoginBtn = document.getElementById("tabLoginBtn");
const tabSignupBtn = document.getElementById("tabSignupBtn");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const authAlert = document.getElementById("authAlert");

// Badge-based auth inputs
const loginBadge = document.getElementById("loginBadge");
const loginPassword = document.getElementById("loginPassword");

const signupName = document.getElementById("signupName");
const signupBadge = document.getElementById("signupBadge");
const signupRole = document.getElementById("signupRole");
const signupAuthCode = document.getElementById("signupAuthCode");
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
const lblBiomedTag = document.getElementById("lblBiomedTag");
const lblLocation = document.getElementById("lblLocation");
const partQuantityGroup = document.getElementById("partQuantityGroup");
const inputQuantity = document.getElementById("inputQuantity");

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

// IT Modals & Elements
const accountsModal = document.getElementById("accountsModal");
const accountsTableBody = document.getElementById("accountsTableBody");
const invitesTableBody = document.getElementById("invitesTableBody");
const genBadge = document.getElementById("genBadge");
const genRole = document.getElementById("genRole");
const latestInviteResult = document.getElementById("latestInviteResult");

const itUserEditModal = document.getElementById("itUserEditModal");
const itUserEditForm = document.getElementById("itUserEditForm");
const itEditUserOriginalEmail = document.getElementById("itEditUserOriginalEmail");
const itEditName = document.getElementById("itEditName");
const itEditBadge = document.getElementById("itEditBadge");
const itEditRole = document.getElementById("itEditRole");

// 4. AUTHENTICATION & SESSION HANDLING
function showAuthAlert(message, type = "error") {
  if (!authAlert) return;
  authAlert.textContent = message;
  authAlert.className = `alert-box ${type}`;
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

// Sign In via Badge ID
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const rawBadge = loginBadge.value.trim().toUpperCase();
    const password = loginPassword.value.trim();
    const silentEmail = badgeToInternalEmail(rawBadge);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, silentEmail, password);
      const uid = userCredential.user.uid;

      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        currentUser = userDoc.data();
      } else {
        // Fallback recognizes both IT-ADMIN and ADMIN as IT Support
        const isIT = rawBadge.includes("IT") || rawBadge.includes("ADMIN");
        currentUser = {
          name: isIT ? "System Administrator" : "Biomedical Specialist",
          badge: rawBadge,
          email: silentEmail,
          role: isIT ? "IT Support" : "Biomed Staff"
        };
      }

      loginForm.reset();
      launchMainApp();
    } catch (err) {
      if (
        err.code === "auth/invalid-credential" || 
        err.code === "auth/user-not-found" || 
        err.code === "auth/wrong-password"
      ) {
        showAuthAlert("Invalid Badge ID or Password.", "error");
      } else {
        showAuthAlert(err.message.replace("Firebase: ", ""), "error");
      }
    }
  });
}

// Sign Up via Badge ID with IT Authorization Code Verification
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const name = signupName.value.trim();
    const badge = signupBadge.value.trim().toUpperCase();
    const role = signupRole.value;
    const authCode = signupAuthCode ? signupAuthCode.value.trim().toUpperCase() : "";
    const password = signupPassword.value.trim();
    const confirmPassword = signupConfirmPassword.value.trim();

    if (!authCode) {
      showAuthAlert("IT Authorization Code is required to register.", "error");
      return;
    }

    if (password.length < 6) {
      showAuthAlert("Password must be at least 6 characters.", "error");
      return;
    }
    if (password !== confirmPassword) {
      showAuthAlert("Passwords do not match.", "error");
      return;
    }

    try {
      // 1. Verify Authorization Code against Firestore
      const invitesRef = collection(db, "invitations");
      const q = query(invitesRef, where("code", "==", authCode), where("used", "==", false));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        showAuthAlert("Invalid or expired IT Authorization Code. Contact IT Support.", "error");
        return;
      }

      const inviteDoc = querySnapshot.docs[0];
      const inviteData = inviteDoc.data();

      // Check if code was locked to a specific badge
      if (inviteData.assignedBadge && inviteData.assignedBadge.toUpperCase() !== badge) {
        showAuthAlert(`This code was issued specifically for Badge ID ${inviteData.assignedBadge}.`, "error");
        return;
      }

      // 2. Create the account in Firebase Auth
      const silentEmail = badgeToInternalEmail(badge);
      const userCredential = await createUserWithEmailAndPassword(auth, silentEmail, password);
      const uid = userCredential.user.uid;

      // 3. Save profile in Firestore
      const userData = { 
        uid, 
        name, 
        badge, 
        role, 
        email: silentEmail,
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, "users", uid), userData);

      // 4. Burn the authorization code
      await updateDoc(doc(db, "invitations", inviteDoc.id), {
        used: true,
        usedByBadge: badge,
        usedByName: name,
        usedAt: serverTimestamp()
      });

      signupForm.reset();
      showAuthAlert(`Badge ${badge} authorized & registered! You can now sign in.`, "success");
      tabLoginBtn.click();
      if (loginBadge) loginBadge.value = badge;
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        showAuthAlert(`Badge ID ${badge} is already registered.`, "error");
      } else {
        showAuthAlert(err.message.replace("Firebase: ", ""), "error");
      }
    }
  });
}

// Quick Demo shortcuts
window.fillDemo = function(roleKey) {
  if (tabLoginBtn) tabLoginBtn.click();
  if (roleKey === "staff") {
    if (loginBadge) loginBadge.value = "BME-402";
    if (loginPassword) loginPassword.value = "Password123";
  } else if (roleKey === "supervisor") {
    if (loginBadge) loginBadge.value = "BME-SUPER";
    if (loginPassword) loginPassword.value = "Password123";
  }
};

// Global Firebase Auth State Listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      currentUser = userDoc.data();
    } else {
      const emailPrefix = user.email ? user.email.split("@")[0].toUpperCase() : "BM-01";
      const isIT = emailPrefix.includes("IT") || emailPrefix.includes("ADMIN");
      currentUser = {
        name: isIT ? "System Administrator" : "Hospital Staff",
        badge: emailPrefix,
        email: user.email || "",
        role: isIT ? "IT Support" : "Biomed Staff"
      };
    }
    launchMainApp();
  } else {
    currentUser = null;
    if (mainApp) mainApp.classList.add("hidden");
    if (authScreen) authScreen.classList.remove("hidden");
  }
});

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    currentUser = null;
    if (mainApp) mainApp.classList.add("hidden");
    if (authScreen) authScreen.classList.remove("hidden");
    clearAuthAlert();
  });
}

function launchMainApp() {
  if (authScreen) authScreen.classList.add("hidden");
  if (mainApp) mainApp.classList.remove("hidden");
  renderUserSession();
  setupCloudRealtimeSync();
}

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

// 5. REAL-TIME CLOUD DATABASE SYNC (FIRESTORE)
function setupCloudRealtimeSync() {
  onSnapshot(collection(db, "inventory"), (snapshot) => {
    inventory = [];
    snapshot.forEach(docSnap => {
      inventory.push({ ...docSnap.data(), firestoreId: docSnap.id });
    });
    renderTable();
  });
}

// 6. INVENTORY RENDERING & KPIS
function updateKPIs() {
  if (!kpiMachines || !kpiParts || !kpiPending) return;
  kpiMachines.textContent = inventory.filter(i => i.type === "Machine").length;
  kpiParts.textContent = inventory.filter(i => i.type === "Part").length;
  kpiPending.textContent = inventory.filter(i => i.status === "Pending").length;
}

function renderTable() {
  if (!inventoryTableBody) return;
  const queryText = (searchInput ? searchInput.value : "").toLowerCase().trim();
  const filter = statusFilter ? statusFilter.value : "ALL";

  inventoryTableBody.innerHTML = "";

  const filteredList = inventory.filter(item => {
    const matchesQuery =
      (item.biomedTag && item.biomedTag.toLowerCase().includes(queryText)) ||
      (item.name && item.name.toLowerCase().includes(queryText)) ||
      (item.identifier && item.identifier.toLowerCase().includes(queryText)) ||
      (item.location && item.location.toLowerCase().includes(queryText));

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
          <button class="btn btn-sm btn-outline" onclick="openAssetDetailModal('${item.id}')">👁️ View</button>
          <button class="btn btn-sm btn-approve" onclick="handleApprove('${item.id}')">✅ Approve</button>
          <button class="btn btn-sm btn-clarify" onclick="openClarifyModal('${item.id}')">💬 Clarify</button>
          <button class="btn btn-sm btn-outline" onclick="openEditModal('${item.id}')">✏️ Edit</button>
        </div>
      `;
    } else if (currentUser && currentUser.role === "IT Support") {
      actionHtml = `
        <div style="text-align: right; display: flex; justify-content: flex-end; align-items: center; gap: 0.35rem;">
          <button class="btn btn-sm btn-outline" onclick="openAssetDetailModal('${item.id}')">👁️ View</button>
          <span class="badge badge-locked" style="background:#faf5ff; color:var(--it-accent, #6b46c1);">💻 IT Read-Only</span>
        </div>
      `;
    } else {
      actionHtml = `
        <div style="text-align: right; display: flex; justify-content: flex-end; align-items: center; gap: 0.35rem;">
          <button class="btn btn-sm btn-outline" onclick="openAssetDetailModal('${item.id}')">👁️ View</button>
          <span class="badge badge-locked">🔒 Awaiting Supervisor</span>
          <button class="btn btn-sm btn-outline" onclick="openEditModal('${item.id}')">✏️ Edit</button>
        </div>
      `;
    }

    tr.innerHTML = `
      <td>
        <span class="badge-biomed-tag" onclick="openAssetDetailModal('${item.id}')" title="Click to view full dossier">
          🏷️ ${item.biomedTag || "NO TAG"}
        </span>
      </td>
      <td><span class="badge ${typeClass}">${item.type}</span></td>
      <td>
        <strong class="clickable-asset-title" onclick="openAssetDetailModal('${item.id}')" title="Click to view details">
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

// 7. SUPERVISOR ACTIONS
window.handleApprove = async function(id) {
  const item = inventory.find(i => String(i.id) === String(id));
  if (!item) return;

  const docRef = doc(db, "inventory", String(id));
  await updateDoc(docRef, {
    status: "Approved",
    notes: `Verified & approved by ${currentUser.name} on ${new Date().toLocaleDateString()}`
  });

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
  submitClarifyBtn.addEventListener("click", async () => {
    const note = clarifyNoteInput.value.trim();
    if (!note) {
      alert("Please enter a clarification note.");
      return;
    }
    const item = inventory.find(i => String(i.id) === String(activeClarifyItemId));
    if (item) {
      const docRef = doc(db, "inventory", String(item.id));
      await updateDoc(docRef, {
        status: "Needs Clarification",
        notes: `Supervisor Note: ${note}`
      });
      if (!assetDetailModal.classList.contains("hidden")) {
        openAssetDetailModal(item.id);
      }
    }
    if (clarifyModal) clarifyModal.classList.add("hidden");
  });
}

// 8. ASSET DOSSIER PREVIEW MODAL
window.openAssetDetailModal = function(id) {
  const item = inventory.find(i => String(i.id) === String(id));
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

  let footerHtml = `<button type="button" class="btn btn-outline" onclick="closeDetailModal()">Close</button>`;

  if (currentUser && currentUser.role === "Biomed Supervisor") {
    footerHtml = `
      <button type="button" class="btn btn-outline" onclick="openEditModal('${item.id}')">✏️️ Edit Details</button>
      <button type="button" class="btn btn-warning" onclick="openClarifyModal('${item.id}')">💬 Clarify</button>
      <button type="button" class="btn btn-approve" onclick="handleApprove('${item.id}')">✅ Approve Equipment</button>
      <button type="button" class="btn btn-outline" onclick="closeDetailModal()">Close</button>
    `;
  } else if (currentUser && currentUser.role === "Biomed Staff") {
    footerHtml = `
      <button type="button" class="btn btn-outline" onclick="openEditModal('${item.id}')">✏️ Edit Asset</button>
      <button type="button" class="btn btn-outline" onclick="closeDetailModal()">Close</button>
    `;
  }

  detailModalFooter.innerHTML = footerHtml;
  assetDetailModal.classList.remove("hidden");
};

function closeDetailModal() {
  assetDetailModal.classList.add("hidden");
}
window.closeDetailModal = closeDetailModal;
if (closeDetailModalBtn) closeDetailModalBtn.addEventListener("click", closeDetailModal);
if (closeDetailModalBottomBtn) closeDetailModalBottomBtn.addEventListener("click", closeDetailModal);

// 9. IMAGE COMPRESSION & CAMERA
function processAndSetImage(file) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      const MAX_DIM = 900;

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

      currentPhotoBase64 = canvas.toDataURL("image/jpeg", 0.7);
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
  btnTriggerGallery.addEventListener("click", () => inputPhoto.click());
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
      alert("Unable to access camera: " + err.message);
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

    currentPhotoBase64 = cameraCanvas.toDataURL("image/jpeg", 0.7);
    photoPreviewImg.src = currentPhotoBase64;
    photoPreviewContainer.classList.remove("hidden");

    stopDesktopLiveCamera();
  });
}

// PDF Attachment Handler
if (inputPdf) {
  inputPdf.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF files are supported for calibration reports.");
      inputPdf.value = "";
      return;
    }

    if (file.size > 1024 * 1024) {
      alert("PDF file too large for cloud sync! Please upload files under 1MB.");
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

// Lightbox & PDF Viewer
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

// 10. EDIT & ADD ASSET (CLOUD SYNCED)
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
  const item = inventory.find(i => String(i.id) === String(id));
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
    if (modalTitle) modalTitle.textContent = "➕ Register New Medical Device";
    
    // Clinical Machine Labels
    if (lblBiomedTag) lblBiomedTag.textContent = "Hospital Asset / Biomed Tag";
    if (inputBiomedTag) inputBiomedTag.placeholder = "e.g., BME-2026-0155";

    if (lblIdentifier) lblIdentifier.textContent = "Factory Serial Number (SN)";
    if (inputIdentifier) inputIdentifier.placeholder = "e.g., SN-88341";

    if (lblItemName) lblItemName.textContent = "Equipment / Model Name";
    if (inputName) inputName.placeholder = "e.g., Draeger Fabius Plus";

    if (lblLocation) lblLocation.textContent = "Clinical Department / Ward";
    if (inputLocation) inputLocation.placeholder = "e.g., OR-04 / ICU-East";

    if (partQuantityGroup) partQuantityGroup.classList.add("hidden");
    if (lblPhotoUpload) lblPhotoUpload.textContent = "📷 Equipment Photo";
    if (pdfUploadGroup) pdfUploadGroup.classList.remove("hidden");

    if (itemForm) itemForm.reset();
    if (itemModal) itemModal.classList.remove("hidden");
  });
}
// Register Part Specific Setup
const btnAddPart = document.getElementById("btnAddPart");
if (btnAddPart) {
  btnAddPart.addEventListener("click", () => {
    resetModalAttachments();
    if (editItemId) editItemId.value = "";
    if (formItemType) formItemType.value = "Part";
    if (modalTitle) modalTitle.textContent = "🔩 Register Spare Part / Consumable";

    // Workshop Spare Part Labels
    if (lblBiomedTag) lblBiomedTag.textContent = "Part SKU / Catalog P/N";
    if (inputBiomedTag) inputBiomedTag.placeholder = "e.g., PN-O2-CELL-01";

    if (lblIdentifier) lblIdentifier.textContent = "Compatible Machine / Model";
    if (inputIdentifier) inputIdentifier.placeholder = "e.g., Draeger Fabius / Evita XL";

    if (lblItemName) lblItemName.textContent = "Part Description & Specs";
    if (inputName) inputName.placeholder = "e.g., O2 Sensor Fuel Cell (M-03)";

    if (lblLocation) lblLocation.textContent = "Workshop Bin / Shelf Location";
    if (inputLocation) inputLocation.placeholder = "e.g., Rack B, Bin 04";

    if (partQuantityGroup) partQuantityGroup.classList.remove("hidden");
    if (inputQuantity) inputQuantity.value = 1;

    if (lblPhotoUpload) lblPhotoUpload.textContent = "📷 Part / Packaging Photo";
    if (pdfUploadGroup) pdfUploadGroup.classList.add("hidden");

    if (itemForm) itemForm.reset();
    if (itemModal) itemModal.classList.remove("hidden");
  });
}
if (itemForm) {
  itemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idToEdit = editItemId ? editItemId.value : "";
    const itemType = formItemType.value;

    const payload = {
      biomedTag: inputBiomedTag.value.trim().toUpperCase(),
      type: itemType,
      name: inputName.value.trim(),
      identifier: inputIdentifier.value.trim(),
      location: inputLocation.value.trim(),
      notes: inputRemarks.value.trim() || "Awaiting supervisor verification.",
      photoData: currentPhotoBase64,
      pdfData: itemType === "Machine" ? currentPdfBase64 : null,
      pdfName: itemType === "Machine" ? currentPdfFileName : null
    };

    if (idToEdit) {
      if (currentUser && currentUser.role !== "Biomed Supervisor") {
        payload.status = "Pending";
      }
      await updateDoc(doc(db, "inventory", String(idToEdit)), payload);
    } else {
      const newId = String(Date.now());
      payload.id = newId;
      payload.status = "Pending";
      payload.submittedBy = currentUser ? currentUser.name : "Biomed Staff";
      await setDoc(doc(db, "inventory", newId), payload);
    }

    if (itemModal) itemModal.classList.add("hidden");
  });
}

// Modal Closers
const closeItemModalBtn = document.getElementById("closeItemModalBtn");
const cancelItemModalBtn = document.getElementById("cancelItemModalBtn");
if (closeItemModalBtn) closeItemModalBtn.addEventListener("click", () => itemModal.classList.add("hidden"));
if (cancelItemModalBtn) cancelItemModalBtn.addEventListener("click", () => itemModal.classList.add("hidden"));

const closeClarifyModalBtn = document.getElementById("closeClarifyModalBtn");
const cancelClarifyBtn = document.getElementById("cancelClarifyBtn");
if (closeClarifyModalBtn) closeClarifyModalBtn.addEventListener("click", () => clarifyModal.classList.add("hidden"));
if (cancelClarifyBtn) cancelClarifyBtn.addEventListener("click", () => clarifyModal.classList.add("hidden"));

// 11. IT SYSTEM SUPPORT & INVITE CODE GENERATION
window.exportDatabaseBackup = function() {
  const data = {
    backupDate: new Date().toISOString(),
    inventoryCount: inventory.length,
    inventoryData: inventory
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const a = document.createElement("a");
  a.setAttribute("href", dataStr);
  a.setAttribute("download", `biomed_cloud_backup_${Date.now()}.json`);
  document.body.appendChild(a);
  a.click();
  a.remove();
};

window.runSystemDiagnostics = function() {
  alert(`⚡ Cloud Firestore Status: Connected\n• Active Inventory Records: ${inventory.length}`);
};

// Generate a random 4-digit code (e.g. BIO-7821)
window.handleGenerateInvite = async function() {
  const badgeTarget = genBadge ? genBadge.value.trim().toUpperCase() : "";
  const roleTarget = genRole ? genRole.value : "Biomed Staff";

  if (!badgeTarget) {
    alert("Please enter a target Staff Badge ID (e.g. BM-02).");
    return;
  }

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const inviteCode = `BIO-${randomNum}`;

  try {
    await setDoc(doc(db, "invitations", inviteCode), {
      code: inviteCode,
      assignedBadge: badgeTarget,
      assignedRole: roleTarget,
      used: false,
      createdBy: currentUser ? currentUser.badge : "IT-ADMIN",
      createdAt: serverTimestamp()
    });

    if (latestInviteResult) {
      latestInviteResult.innerHTML = `
        ✅ <strong>Code Generated:</strong> <code style="font-size:1.1rem; color:var(--it-accent, #6b46c1);">${inviteCode}</code>
        <p style="margin:0.25rem 0 0; font-size:0.8rem;">Give this code to technician with Badge <strong>${badgeTarget}</strong>.</p>
      `;
      latestInviteResult.classList.remove("hidden");
    }

    if (genBadge) genBadge.value = "";
    loadAccountsAndInvites();
  } catch (err) {
    alert("Failed to generate invite code: " + err.message);
  }
};

async function loadAccountsAndInvites() {
  if (!accountsTableBody || !invitesTableBody) return;

  // 1. Fetch Invites
  const invitesSnapshot = await getDocs(collection(db, "invitations"));
  allInvites = [];
  invitesSnapshot.forEach(docSnap => allInvites.push(docSnap.data()));

  invitesTableBody.innerHTML = "";
  if (allInvites.length === 0) {
    invitesTableBody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:var(--text-muted);'>No invite codes created yet.</td></tr>";
  } else {
    allInvites.forEach(inv => {
      const tr = document.createElement("tr");
      const statusBadge = inv.used 
        ? `<span class="badge" style="background:#fee2e2; color:#991b1b;">Burned / Used</span>`
        : `<span class="badge" style="background:#dcfce7; color:#166534;">Active</span>`;

      tr.innerHTML = `
        <td><strong style="font-size:0.95rem;">${inv.code}</strong></td>
        <td><code>${inv.assignedBadge || "ANY"}</code></td>
        <td>${inv.assignedRole || "Biomed Staff"}</td>
        <td>${statusBadge}</td>
        <td><small style="color:var(--text-muted);">${inv.usedByBadge ? "Used by " + inv.usedByBadge : "Available"}</small></td>
      `;
      invitesTableBody.appendChild(tr);
    });
  }

  // 2. Fetch Registered Users
  const querySnapshot = await getDocs(collection(db, "users"));
  allUsers = [];
  querySnapshot.forEach(docSnap => allUsers.push(docSnap.data()));

  accountsTableBody.innerHTML = "";
  allUsers.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${u.name}</strong></td>
      <td><code>${u.badge}</code></td>
      <td><span class="badge" style="background:#edf2f7; color:#2d3748;">${u.role}</span></td>
      <td style="text-align: right;">
        <button class="btn btn-sm btn-outline" onclick="openItUserEditModal('${u.badge}')">✏️ Edit Details</button>
      </td>
    `;
    accountsTableBody.appendChild(tr);
  });
}

window.openAccountsModal = async function() {
  if (!accountsModal) return;
  accountsModal.classList.remove("hidden");
  if (latestInviteResult) latestInviteResult.classList.add("hidden");
  await loadAccountsAndInvites();
};

window.openItUserEditModal = function(badge) {
  const user = allUsers.find(u => u.badge.toUpperCase() === badge.toUpperCase());
  if (!user) return;

  if (itEditUserOriginalEmail) itEditUserOriginalEmail.value = user.email || badgeToInternalEmail(user.badge);
  if (itEditName) itEditName.value = user.name;
  if (itEditBadge) itEditBadge.value = user.badge;
  if (itEditRole) itEditRole.value = user.role;

  if (itUserEditModal) itUserEditModal.classList.remove("hidden");
};

if (itUserEditForm) {
  itUserEditForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const badge = itEditBadge.value.trim().toUpperCase();
    const newName = itEditName.value.trim();
    const newRole = itEditRole.value;

    const user = allUsers.find(u => u.badge.toUpperCase() === badge.toUpperCase());
    if (!user || !user.uid) {
      alert("Unable to find user UID to update.");
      return;
    }

    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: newName,
        role: newRole
      });
      alert(`Updated profile for ${badge}`);
      if (itUserEditModal) itUserEditModal.classList.add("hidden");
      await loadAccountsAndInvites();
    } catch (err) {
      alert("Failed to update user: " + err.message);
    }
  });
}

const closeAccountsModalBtn = document.getElementById("closeAccountsModalBtn");
const closeAccountsBtn = document.getElementById("closeAccountsBtn");
if (closeAccountsModalBtn) closeAccountsModalBtn.addEventListener("click", () => accountsModal.classList.add("hidden"));
if (closeAccountsBtn) closeAccountsBtn.addEventListener("click", () => accountsModal.classList.add("hidden"));

const closeItUserEditModalBtn = document.getElementById("closeItUserEditModalBtn");
const cancelItUserEditBtn = document.getElementById("cancelItUserEditBtn");
if (closeItUserEditModalBtn) closeItUserEditModalBtn.addEventListener("click", () => itUserEditModal.classList.add("hidden"));
if (cancelItUserEditBtn) cancelItUserEditBtn.addEventListener("click", () => itUserEditModal.classList.add("hidden"));

// Search & Filter Listeners
if (searchInput) searchInput.addEventListener("input", renderTable);
if (statusFilter) statusFilter.addEventListener("change", renderTable);
