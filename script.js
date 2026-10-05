import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyDGOCGKNFLPx1GMWeVIqG0GXsm9tSeWOYM",
  authDomain: "biomed-hub-b028c.firebaseapp.com",
  projectId: "biomed-hub-b028c",
  storageBucket: "biomed-hub-b028c.appspot.com",
  messagingSenderId: "365287012586",
  appId: "1:365287012586:web:8e36780c7db5ea4b3da277"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Domain mapping: converts badge to internal email unless an email is already typed
const INTERNAL_DOMAIN = "@hospital.internal";
function badgeToInternalEmail(badge) {
  const cleaned = (badge || "").trim().toLowerCase().replace(/\s+/g, "");
  return cleaned.includes("@") ? cleaned : `${cleaned}${INTERNAL_DOMAIN}`;
}

// ================= APP STATE =================
let inventory = [];
let allUsers = [];
let allInvites = [];
let currentUser = null;
let currentTypeTab = "ALL"; // 'ALL', 'Machine', or 'Part'
let activeClarifyItemId = null;

let currentPhotoBase64 = null;
let currentPdfBase64 = null;
let currentPdfFileName = null;
let videoStream = null;

// ================= DOM ELEMENTS =================
const authScreen = document.getElementById("authScreen");
const mainApp = document.getElementById("mainApp");
const authAlert = document.getElementById("authAlert");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const tabLoginBtn = document.getElementById("tabLoginBtn");
const tabSignupBtn = document.getElementById("tabSignupBtn");
const userBadge = document.getElementById("userBadge");
const logoutBtn = document.getElementById("logoutBtn");
const itAdminBanner = document.getElementById("itAdminBanner");
const biomedActionButtons = document.getElementById("biomedActionButtons");

// KPIs
const kpiMachines = document.getElementById("kpiMachines");
const kpiParts = document.getElementById("kpiParts");
const kpiPending = document.getElementById("kpiPending");
const cardMachines = document.getElementById("cardMachines");
const cardParts = document.getElementById("cardParts");

// Search & Filter
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const inventoryTableBody = document.getElementById("inventoryTableBody");
const emptyNotice = document.getElementById("emptyNotice");

// Add / Edit Modal Elements
const itemModal = document.getElementById("itemModal");
const modalTitle = document.getElementById("modalTitle");
const itemForm = document.getElementById("itemForm");
const editItemId = document.getElementById("editItemId");
const formItemType = document.getElementById("formItemType");
const machineFormFields = document.getElementById("machineFormFields");
const partFormFields = document.getElementById("partFormFields");
const btnAddMachine = document.getElementById("btnAddMachine");
const btnAddPart = document.getElementById("btnAddPart");
const closeItemModalBtn = document.getElementById("closeItemModalBtn");
const cancelItemModalBtn = document.getElementById("cancelItemModalBtn");

// Commissioning Machine Fields
const displayAcceptanceDate = document.getElementById("displayAcceptanceDate");
const inputAcceptanceDate = document.getElementById("inputAcceptanceDate");
const inputBiomedTag = document.getElementById("inputBiomedTag");
const inputUserBadge = document.getElementById("inputUserBadge");
const selectGrouping = document.getElementById("selectGrouping");
const inputName = document.getElementById("inputName");
const inputModelName = document.getElementById("inputModelName");
const inputManufacturer = document.getElementById("inputManufacturer");
const inputIdentifier = document.getElementById("inputIdentifier");
const selectLocation = document.getElementById("selectLocation");
const selectSubLocation = document.getElementById("selectSubLocation");

// Spare Part Fields
const inputPartTag = document.getElementById("inputPartTag");
const inputPartName = document.getElementById("inputPartName");
const inputPartCompat = document.getElementById("inputPartCompat");
const inputPartLocation = document.getElementById("inputPartLocation");
const inputQuantity = document.getElementById("inputQuantity");

// Remarks & Attachments
const inputRemarks = document.getElementById("inputRemarks");
const btnTriggerCamera = document.getElementById("btnTriggerCamera");
const btnTriggerGallery = document.getElementById("btnTriggerGallery");
const inputCameraCapture = document.getElementById("inputCameraCapture");
const inputPhoto = document.getElementById("inputPhoto");
const photoPreviewContainer = document.getElementById("photoPreviewContainer");
const photoPreviewImg = document.getElementById("photoPreviewImg");
const removePhotoBtn = document.getElementById("removePhotoBtn");

const pdfUploadGroup = document.getElementById("pdfUploadGroup");
const inputPdf = document.getElementById("inputPdf");
const pdfPreviewContainer = document.getElementById("pdfPreviewContainer");
const pdfFileName = document.getElementById("pdfFileName");
const removePdfBtn = document.getElementById("removePdfBtn");

// Live Webcam Modal
const liveCameraModal = document.getElementById("liveCameraModal");
const cameraVideo = document.getElementById("cameraVideo");
const cameraCanvas = document.getElementById("cameraCanvas");
const btnCaptureShutter = document.getElementById("btnCaptureShutter");
const btnCancelCamera = document.getElementById("btnCancelCamera");
const closeLiveCameraBtn = document.getElementById("closeLiveCameraBtn");

// Dossier Modal
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
const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");
const closeDetailModalBottomBtn = document.getElementById("closeDetailModalBottomBtn");

// Image Lightbox
const imageViewerModal = document.getElementById("imageViewerModal");
const imageViewerImg = document.getElementById("imageViewerImg");
const closeImageViewerBtn = document.getElementById("closeImageViewerBtn");

// Supervisor Clarification Modal
const clarifyModal = document.getElementById("clarifyModal");
const clarifyNoteInput = document.getElementById("clarifyNoteInput");
const submitClarifyBtn = document.getElementById("submitClarifyBtn");
const cancelClarifyBtn = document.getElementById("cancelClarifyBtn");
const closeClarifyModalBtn = document.getElementById("closeClarifyModalBtn");

// IT Admin Modal
const accountsModal = document.getElementById("accountsModal");
const closeAccountsModalBtn = document.getElementById("closeAccountsModalBtn");
const closeAccountsBtn = document.getElementById("closeAccountsBtn");
const accountsTableBody = document.getElementById("accountsTableBody");
const invitesTableBody = document.getElementById("invitesTableBody");

// ================= AUTHENTICATION LOGIC =================
tabLoginBtn.addEventListener("click", () => {
  tabLoginBtn.classList.add("active");
  tabSignupBtn.classList.remove("active");
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
  authAlert.classList.add("hidden");
});

tabSignupBtn.addEventListener("click", () => {
  tabSignupBtn.classList.add("active");
  tabLoginBtn.classList.remove("active");
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  authAlert.classList.add("hidden");
});

function showAuthError(msg) {
  authAlert.textContent = msg;
  authAlert.classList.remove("hidden");
}

// Sign In Handler
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authAlert.classList.add("hidden");

  const rawBadge = document.getElementById("loginBadge").value.trim();
  const pass = document.getElementById("loginPassword").value;
  const email = badgeToInternalEmail(rawBadge);

  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    console.log("Logged in successfully:", cred.user.uid);
  } catch (err) {
    console.error("Sign-in failure details:", err);
    if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
      showAuthError("Incorrect Badge ID or Password. Please re-enter.");
    } else if (err.code === "auth/user-not-found") {
      showAuthError(`No account registered under: ${email}`);
    } else if (err.code === "auth/too-many-requests") {
      showAuthError("Too many failed attempts. Please wait a moment and try again.");
    } else {
      showAuthError(`Login Error [${err.code}]: ${err.message}`);
    }
  }
});

// Staff Self-Registration Handler
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authAlert.classList.add("hidden");

  const name = document.getElementById("signupName").value.trim();
  const badge = document.getElementById("signupBadge").value.trim().toUpperCase();
  const role = document.getElementById("signupRole").value;
  const authCode = document.getElementById("signupAuthCode").value.trim().toUpperCase();
  const pass = document.getElementById("signupPassword").value;
  const confirmPass = document.getElementById("signupConfirmPassword").value;

  if (pass !== confirmPass) {
    showAuthError("Passwords do not match.");
    return;
  }

  try {
    // Check IT invite authorization code
    const inviteDoc = await getDoc(doc(db, "invitations", authCode));
    if (!inviteDoc.exists() || inviteDoc.data().used) {
      showAuthError("Invalid or expired IT Authorization Code.");
      return;
    }
    const invData = inviteDoc.data();
    if (invData.badge && invData.badge.toUpperCase() !== badge) {
      showAuthError(`This passcode is reserved for Badge ID: ${invData.badge}`);
      return;
    }

    const email = badgeToInternalEmail(badge);
    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    // Save profile record in Firestore users collection
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      name,
      badge,
      role,
      email,
      createdAt: serverTimestamp()
    });

    // Mark passcode as redeemed
    await updateDoc(doc(db, "invitations", authCode), {
      used: true,
      usedBy: badge,
      usedAt: serverTimestamp()
    });
  } catch (err) {
    showAuthError(`Registration Error: ${err.message}`);
  }
});

// Sign Out Handler
logoutBtn.addEventListener("click", () => signOut(auth));

// ================= SESSION MONITOR =================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        currentUser = userDoc.data();
      } else {
        currentUser = {
          uid: user.uid,
          name: "Staff User",
          badge: user.email.split("@")[0].toUpperCase(),
          role: "Biomed Staff"
        };
      }

      userBadge.innerHTML = `<span>👤</span> <strong>${currentUser.name}</strong> [${currentUser.badge}] (${currentUser.role})`;
      authScreen.classList.add("hidden");
      mainApp.classList.remove("hidden");

      if (currentUser.role === "IT Support") {
        itAdminBanner.classList.remove("hidden");
        biomedActionButtons.classList.add("hidden");
      } else {
        itAdminBanner.classList.add("hidden");
        biomedActionButtons.classList.remove("hidden");
      }

      initInventoryListener();
    } catch (err) {
      console.error("Session fetch error:", err);
    }
  } else {
    currentUser = null;
    authScreen.classList.remove("hidden");
    mainApp.classList.add("hidden");
  }
});

// ================= FIRESTORE LISTENER =================
function initInventoryListener() {
  onSnapshot(collection(db, "inventory"), (snapshot) => {
    inventory = [];
    snapshot.forEach((docSnap) => {
      inventory.push({ id: docSnap.id, ...docSnap.data() });
    });
    updateKPIs();
    renderTable();
  });
}

// ================= KPIS & TAB FILTERING =================
function updateKPIs() {
  const machines = inventory.filter((i) => i.type === "Machine").length;
  const parts = inventory.filter((i) => i.type === "Part").length;
  const pending = inventory.filter((i) => i.status === "Pending").length;

  kpiMachines.textContent = machines;
  kpiParts.textContent = parts;
  kpiPending.textContent = pending;
}

function setTypeFilterTab(type) {
  if (currentTypeTab === type) {
    currentTypeTab = "ALL";
  } else {
    currentTypeTab = type;
  }

  // Visual card highlighting
  cardMachines.style.outline = currentTypeTab === "Machine" ? "2px solid var(--primary)" : "none";
  cardParts.style.outline = currentTypeTab === "Part" ? "2px solid var(--secondary)" : "none";

  renderTable();
}

cardMachines.addEventListener("click", () => setTypeFilterTab("Machine"));
cardParts.addEventListener("click", () => setTypeFilterTab("Part"));

// ================= TABLE RENDERING =================
function renderTable() {
  const q = searchInput.value.toLowerCase().trim();
  const stFilter = statusFilter.value;

  const filtered = inventory.filter((item) => {
    const matchesSearch =
      (item.biomedTag && item.biomedTag.toLowerCase().includes(q)) ||
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.identifier && item.identifier.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q));

    const matchesStatus = stFilter === "ALL" || item.status === stFilter;
    const matchesType = currentTypeTab === "ALL" || item.type === currentTypeTab;

    return matchesSearch && matchesStatus && matchesType;
  });

  inventoryTableBody.innerHTML = "";
  if (filtered.length === 0) {
    emptyNotice.classList.remove("hidden");
    return;
  }
  emptyNotice.classList.add("hidden");

  filtered.forEach((item) => {
    const tr = document.createElement("tr");

    const typeClass = item.type === "Machine" ? "badge-machine" : "badge-part";
    const statusClass =
      item.status === "Approved"
        ? "badge-approved"
        : item.status === "Needs Clarification"
        ? "badge-clarify"
        : "badge-pending";

    const stockDisplay =
      item.type === "Part"
        ? `<span class="badge" style="background:#e0e7ff; color:#4338ca;">${item.quantity ?? 1}</span>`
        : `<span style="color:var(--text-muted); font-size:0.8rem;">—</span>`;

    // Attachments indicator
    let attachmentsHtml = `<div style="display:flex; gap:0.35rem;">`;
    if (item.photoData) {
      attachmentsHtml += `<span title="Photo Attached" style="cursor:pointer;" onclick="openAssetDetailModal('${item.id}')">📷</span>`;
    }
    if (item.pdfData) {
      attachmentsHtml += `<span title="PDF Report Attached" style="cursor:pointer;" onclick="openAssetDetailModal('${item.id}')">📑</span>`;
    }
    if (!item.photoData && !item.pdfData) {
      attachmentsHtml += `<span style="color:var(--text-muted); font-size:0.8rem;">None</span>`;
    }
    attachmentsHtml += `</div>`;

    // Actions depending on Role
    let actionsHtml = `<div style="display:flex; gap:0.35rem; justify-content:flex-end;">`;
    actionsHtml += `<button class="btn btn-outline btn-sm" onclick="openAssetDetailModal('${item.id}')">👁 View</button>`;

    if (currentUser && currentUser.role === "Biomed Supervisor") {
      if (item.status !== "Approved") {
        actionsHtml += `<button class="btn btn-sm" style="background:#10b981; color:#fff;" onclick="approveItem('${item.id}')">✔</button>`;
        actionsHtml += `<button class="btn btn-warning btn-sm" onclick="openClarifyModal('${item.id}')">💬</button>`;
      }
    }

    if (currentUser && currentUser.role !== "IT Support") {
      actionsHtml += `<button class="btn btn-outline btn-sm" onclick="editItem('${item.id}')">✏</button>`;
    }
    actionsHtml += `</div>`;

    tr.innerHTML = `
      <td>
        <span class="badge-biomed-tag" onclick="openAssetDetailModal('${item.id}')">
          ${item.type === "Part" ? "🔩" : "🏷️"} ${item.biomedTag || "NO TAG"}
        </span>
      </td>
      <td><span class="badge ${typeClass}">${item.type}</span></td>
      <td>
        <strong class="clickable-asset-title" onclick="openAssetDetailModal('${item.id}')">${item.name}</strong>
        <span class="item-notes">${item.notes || "No notes"}</span>
      </td>
      <td>${attachmentsHtml}</td>
      <td><code>${item.identifier || "—"}</code></td>
      <td>${item.location || "—"}</td>
      <td style="text-align: center;">${stockDisplay}</td>
      <td>
        <span class="badge ${statusClass}">${item.status}</span>
        <span class="item-notes">By: ${item.submittedBy || "Unknown"}</span>
      </td>
      <td>${actionsHtml}</td>
    `;
    inventoryTableBody.appendChild(tr);
  });
}

searchInput.addEventListener("input", renderTable);
statusFilter.addEventListener("change", renderTable);

// ================= MODAL: REGISTER MACHINE / PART =================
btnAddMachine.addEventListener("click", () => {
  itemForm.reset();
  editItemId.value = "";
  formItemType.value = "Machine";
  modalTitle.textContent = "Register Medical Equipment";

  // Switch form layout
  machineFormFields.classList.remove("hidden");
  partFormFields.classList.add("hidden");
  pdfUploadGroup.classList.remove("hidden");

  // Format Acceptance Date
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" });
  displayAcceptanceDate.textContent = formattedDate;
  inputAcceptanceDate.value = formattedDate;

  // Pre-fill Badge
  inputUserBadge.value = currentUser ? currentUser.badge : "";

  clearAttachmentPreviews();
  itemModal.classList.remove("hidden");
});

btnAddPart.addEventListener("click", () => {
  itemForm.reset();
  editItemId.value = "";
  formItemType.value = "Part";
  modalTitle.textContent = "Register Spare Part / Consumable";

  // Switch form layout
  machineFormFields.classList.add("hidden");
  partFormFields.classList.remove("hidden");
  pdfUploadGroup.classList.add("hidden");

  clearAttachmentPreviews();
  itemModal.classList.remove("hidden");
});

closeItemModalBtn.addEventListener("click", () => itemModal.classList.add("hidden"));
cancelItemModalBtn.addEventListener("click", () => itemModal.classList.add("hidden"));

// Form Submit Handler
itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const type = formItemType.value;
  const isEditing = !!editItemId.value;

  let payload = {
    type,
    updatedAt: serverTimestamp()
  };

  if (type === "Machine") {
    const loc = selectLocation.value && selectSubLocation.value 
      ? `${selectLocation.value} - ${selectSubLocation.value}` 
      : selectLocation.value || "";

    payload = {
      ...payload,
      biomedTag: inputBiomedTag.value.trim().toUpperCase(),
      acceptanceDate: inputAcceptanceDate.value,
      userBadge: inputUserBadge.value.trim(),
      grouping: selectGrouping.value,
      name: inputName.value,
      modelName: inputModelName.value.trim(),
      manufacturer: inputManufacturer.value,
      identifier: inputIdentifier.value.trim(),
      location: loc,
      notes: inputRemarks.value.trim(),
      photoData: currentPhotoBase64,
      pdfData: currentPdfBase64,
      pdfName: currentPdfFileName
    };
  } else {
    payload = {
      ...payload,
      biomedTag: inputPartTag.value.trim().toUpperCase(),
      name: inputPartName.value.trim(),
      identifier: inputPartCompat.value.trim(),
      location: inputPartLocation.value.trim(),
      quantity: parseInt(inputQuantity.value, 10) || 1,
      notes: inputRemarks.value.trim(),
      photoData: currentPhotoBase64,
      pdfData: null,
      pdfName: null
    };
  }

  if (!isEditing) {
    payload.createdAt = serverTimestamp();
    payload.submittedBy = currentUser ? currentUser.name : "Staff";
    payload.status = "Pending";
    await setDoc(doc(collection(db, "inventory")), payload);
  } else {
    await updateDoc(doc(db, "inventory", editItemId.value), payload);
  }

  itemModal.classList.add("hidden");
});

// Edit Existing Item
window.editItem = function (id) {
  const item = inventory.find((i) => i.id === id);
  if (!item) return;

  itemForm.reset();
  editItemId.value = item.id;
  formItemType.value = item.type;
  modalTitle.textContent = `Edit ${item.type}: ${item.biomedTag}`;

  if (item.type === "Machine") {
    machineFormFields.classList.remove("hidden");
    partFormFields.classList.add("hidden");
    pdfUploadGroup.classList.remove("hidden");

    displayAcceptanceDate.textContent = item.acceptanceDate || "N/A";
    inputAcceptanceDate.value = item.acceptanceDate || "";
    inputBiomedTag.value = item.biomedTag || "";
    inputUserBadge.value = item.userBadge || "";
    selectGrouping.value = item.grouping || "";
    inputName.value = item.name || "";
    inputModelName.value = item.modelName || "";
    inputManufacturer.value = item.manufacturer || "";
    inputIdentifier.value = item.identifier || "";
  } else {
    machineFormFields.classList.add("hidden");
    partFormFields.classList.remove("hidden");
    pdfUploadGroup.classList.add("hidden");

    inputPartTag.value = item.biomedTag || "";
    inputPartName.value = item.name || "";
    inputPartCompat.value = item.identifier || "";
    inputPartLocation.value = item.location || "";
    inputQuantity.value = item.quantity || 1;
  }

  inputRemarks.value = item.notes || "";

  // Pre-fill existing photo / pdf
  currentPhotoBase64 = item.photoData || null;
  if (currentPhotoBase64) {
    photoPreviewImg.src = currentPhotoBase64;
    photoPreviewContainer.classList.remove("hidden");
  } else {
    photoPreviewContainer.classList.add("hidden");
  }

  currentPdfBase64 = item.pdfData || null;
  currentPdfFileName = item.pdfName || null;
  if (currentPdfBase64) {
    pdfFileName.textContent = currentPdfFileName || "Attached Document.pdf";
    pdfPreviewContainer.classList.remove("hidden");
  } else {
    pdfPreviewContainer.classList.add("hidden");
  }

  itemModal.classList.remove("hidden");
};

// ================= ATTACHMENTS (PHOTO & PDF) =================
function clearAttachmentPreviews() {
  currentPhotoBase64 = null;
  currentPdfBase64 = null;
  currentPdfFileName = null;
  photoPreviewContainer.classList.add("hidden");
  pdfPreviewContainer.classList.add("hidden");
  inputPhoto.value = "";
  inputCameraCapture.value = "";
  inputPdf.value = "";
}

btnTriggerGallery.addEventListener("click", () => inputPhoto.click());
btnTriggerCamera.addEventListener("click", () => {
  // Mobile fallback or desktop webcam
  if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
    inputCameraCapture.click();
  } else {
    openWebcam();
  }
});

// File input image reader
function handleImageFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    currentPhotoBase64 = e.target.result;
    photoPreviewImg.src = currentPhotoBase64;
    photoPreviewContainer.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

inputPhoto.addEventListener("change", (e) => handleImageFile(e.target.files[0]));
inputCameraCapture.addEventListener("change", (e) => handleImageFile(e.target.files[0]));
removePhotoBtn.addEventListener("click", () => {
  currentPhotoBase64 = null;
  photoPreviewContainer.classList.add("hidden");
});

// PDF file reader
inputPdf.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024) {
    alert("PDF size exceeds 1MB limit. Please compress file.");
    inputPdf.value = "";
    return;
  }
  currentPdfFileName = file.name;
  const reader = new FileReader();
  reader.onload = (ev) => {
    currentPdfBase64 = ev.target.result;
    pdfFileName.textContent = file.name;
    pdfPreviewContainer.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});
removePdfBtn.addEventListener("click", () => {
  currentPdfBase64 = null;
  currentPdfFileName = null;
  pdfPreviewContainer.classList.add("hidden");
  inputPdf.value = "";
});

// Desktop Live Webcam
async function openWebcam() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraVideo.srcObject = videoStream;
    liveCameraModal.classList.remove("hidden");
  } catch (err) {
    inputCameraCapture.click();
  }
}

function stopWebcam() {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
    videoStream = null;
  }
  liveCameraModal.classList.add("hidden");
}

btnCaptureShutter.addEventListener("click", () => {
  cameraCanvas.width = cameraVideo.videoWidth;
  cameraCanvas.height = cameraVideo.videoHeight;
  const ctx = cameraCanvas.getContext("2d");
  ctx.drawImage(cameraVideo, 0, 0);
  currentPhotoBase64 = cameraCanvas.toDataURL("image/jpeg", 0.85);
  photoPreviewImg.src = currentPhotoBase64;
  photoPreviewContainer.classList.remove("hidden");
  stopWebcam();
});

btnCancelCamera.addEventListener("click", stopWebcam);
closeLiveCameraBtn.addEventListener("click", stopWebcam);

// ================= DOSSIER DETAIL MODAL =================
window.openAssetDetailModal = function (id) {
  const item = inventory.find((i) => i.id === id);
  if (!item) return;

  detailTypeBadge.textContent = item.type;
  detailTypeBadge.className = `badge ${item.type === "Machine" ? "badge-machine" : "badge-part"}`;
  detailAssetName.textContent = item.name;
  detailBiomedTag.textContent = item.biomedTag || "—";
  detailIdentifier.textContent = item.identifier || "—";
  detailLocation.textContent = item.location || "—";
  detailSubmittedBy.textContent = item.submittedBy || "Unknown Staff";
  detailNotes.textContent = item.notes || "No technical remarks logged.";

  detailStatusContainer.innerHTML = `<span class="badge ${
    item.status === "Approved"
      ? "badge-approved"
      : item.status === "Needs Clarification"
      ? "badge-clarify"
      : "badge-pending"
  }">${item.status}</span>`;

  // Photo
  if (item.photoData) {
    detailPhotoContainer.innerHTML = `
      <img src="${item.photoData}" style="max-height:220px; border-radius:6px; cursor:zoom-in; border:1px solid #cbd5e1;" 
           onclick="openLightbox('${item.photoData}', '${item.name}')" />
    `;
  } else {
    detailPhotoContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No photo uploaded.</p>`;
  }

  // PDF
  if (item.pdfData) {
    detailPdfCard.classList.remove("hidden");
    detailPdfContainer.innerHTML = `
      <a href="${item.pdfData}" download="${item.pdfName || "Report.pdf"}" class="btn btn-outline btn-sm">
        📑 Open / Download ${item.pdfName || "Calibration Report"}
      </a>
    `;
  } else {
    detailPdfCard.classList.add("hidden");
  }

  assetDetailModal.classList.remove("hidden");
};

closeDetailModalBtn.addEventListener("click", () => assetDetailModal.classList.add("hidden"));
closeDetailModalBottomBtn.addEventListener("click", () => assetDetailModal.classList.add("hidden"));

// Lightbox
window.openLightbox = function (src, title) {
  imageViewerImg.src = src;
  document.getElementById("imageViewerTitle").textContent = title;
  imageViewerModal.classList.remove("hidden");
};
closeImageViewerBtn.addEventListener("click", () => imageViewerModal.classList.add("hidden"));

// ================= SUPERVISOR ACTIONS =================
window.approveItem = async function (id) {
  if (confirm("Approve this asset for clinical service?")) {
    await updateDoc(doc(db, "inventory", id), {
      status: "Approved",
      approvedBy: currentUser.name,
      approvedAt: serverTimestamp()
    });
  }
};

window.openClarifyModal = function (id) {
  activeClarifyItemId = id;
  clarifyNoteInput.value = "";
  clarifyModal.classList.remove("hidden");
};

submitClarifyBtn.addEventListener("click", async () => {
  if (!activeClarifyItemId) return;
  const note = clarifyNoteInput.value.trim();
  if (!note) return alert("Please specify the clarification request.");

  const item = inventory.find((i) => i.id === activeClarifyItemId);
  const updatedNotes = item.notes ? `${item.notes}\n[Supervisor Request]: ${note}` : `[Supervisor Request]: ${note}`;

  await updateDoc(doc(db, "inventory", activeClarifyItemId), {
    status: "Needs Clarification",
    notes: updatedNotes
  });

  clarifyModal.classList.add("hidden");
  activeClarifyItemId = null;
});

cancelClarifyBtn.addEventListener("click", () => clarifyModal.classList.add("hidden"));
closeClarifyModalBtn.addEventListener("click", () => clarifyModal.classList.add("hidden"));

// ================= EQUIPMENT INVENTORY TOGGLE & SCROLL =================
const eqToggleHeader = document.getElementById("eqToggleHeader");
const eqDropdownList = document.getElementById("eqDropdownList");
const eqArrowIcon = document.getElementById("eqArrowIcon");

if (eqToggleHeader && eqDropdownList) {
  eqToggleHeader.addEventListener("click", () => {
    eqDropdownList.classList.toggle("hidden");
    if (eqArrowIcon) {
      eqArrowIcon.textContent = eqDropdownList.classList.contains("hidden") ? "►" : "▼";
    }
  });
}

document.querySelectorAll(".eq-pill-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".eq-pill-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const targetType = btn.getAttribute("data-filter-type");
    if (targetType === "ALL") {
      searchInput.value = "";
      renderTable();
    } else {
      searchInput.placeholder = `Filtering by ${btn.textContent.trim()}...`;
      searchInput.focus();
    }
  });
});

// ==========================================================================
// SIDEBAR NAVIGATION & VIEW SWITCHER (OPTION 1)
// ==========================================================================
const navDashboard = document.getElementById("navDashboard");
const navInventory = document.getElementById("navInventory");
const navSpareParts = document.getElementById("navSpareParts");

const viewDashboard = document.getElementById("viewDashboard");
const viewInventory = document.getElementById("viewInventory");
const pageTitleDisplay = document.getElementById("pageTitleDisplay");

// Helper function to switch active tab styling and toggle views
function setActiveView(activeNavBtn, targetView, titleText) {
  // 1. Reset all sidebar buttons to inactive
  document.querySelectorAll(".sidebar-nav-btn").forEach(btn => btn.classList.remove("active"));
  
  // 2. Set chosen sidebar button as active
  if (activeNavBtn) activeNavBtn.classList.add("active");

  // 3. Hide all views
  if (viewDashboard) viewDashboard.classList.add("hidden");
  if (viewInventory) viewInventory.classList.add("hidden");

  // 4. Show the selected view
  if (targetView) targetView.classList.remove("hidden");

  // 5. Update top header title
  if (pageTitleDisplay) pageTitleDisplay.textContent = titleText;
}

// Event Listener: Click Dashboard
if (navDashboard) {
  navDashboard.addEventListener("click", () => {
    setActiveView(navDashboard, viewDashboard, "Dashboard Overview");
  });
}

// Event Listener: Click Equipment Inventory
if (navInventory) {
  navInventory.addEventListener("click", () => {
    setActiveView(navInventory, viewInventory, "Equipment Inventory Directory");
    renderEquipmentTable(); // Render equipment table when opening this view
  });
}

// Event Listener: Click Spare Parts (Navigates to Dashboard & auto-filters to parts)
if (navSpareParts) {
  navSpareParts.addEventListener("click", () => {
    setActiveView(navSpareParts, viewDashboard, "Spare Parts Registry");
    const statusSelect = document.getElementById("statusFilter");
    if (statusSelect) {
      searchInput.value = "Part";
      renderTable();
    }
  });
}

// Quick filter clicks for Equipment Inventory Pills
document.querySelectorAll("#viewInventory .eq-pill-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#viewInventory .eq-pill-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const targetType = btn.getAttribute("data-filter-type");
    const eqSearch = document.getElementById("eqSearchInput");
    if (eqSearch) {
      if (targetType === "ALL") {
        eqSearch.value = "";
      } else {
        eqSearch.placeholder = `Filtering directory by ${btn.textContent.trim()}...`;
        eqSearch.focus();
      }
    }
  });
});

// Function to populate the Equipment Inventory Table
function renderEquipmentTable() {
  const tbody = document.getElementById("equipmentTableBody");
  if (!tbody) return;

  // Filter only machine/equipment assets from your inventory list
  const equipmentItems = inventoryData.filter(item => item.type === "MACHINE" || !item.type);

  if (equipmentItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-state">No equipment records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = equipmentItems.map(item => `
    <tr>
      <td><span class="badge-biomed-tag" onclick="openDetailModal('${item.id}')">${item.tag || item.biomedTag || 'N/A'}</span></td>
      <td><strong>${item.name || item.equipment || 'Unnamed Equipment'}</strong></td>
      <td>${item.serialNumber || item.sn || '-'}</td>
      <td>${item.pcNumber || '-'}</td>
      <td><span class="badge badge-machine">${item.grouping || item.group || 'General'}</span></td>
      <td>${item.location || item.area || '-'}</td>
      <td>${item.ipmSchedule || 'Quarterly'}</td>
      <td><span class="badge ${item.status === 'APPROVED' ? 'badge-approved' : 'badge-pending'}">${item.status || 'Active'}</span></td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="openDetailModal('${item.id}')">Dossier</button>
      </td>
    </tr>
  `).join("");
}

// ================= IT ADMIN: BACKUP & ACCOUNTS =================
window.exportDatabaseBackup = function () {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inventory, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `biomed_registry_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

window.openAccountsModal = async function () {
  accountsModal.classList.remove("hidden");
  loadAdminTables();
};

closeAccountsModalBtn.addEventListener("click", () => accountsModal.classList.add("hidden"));
closeAccountsBtn.addEventListener("click", () => accountsModal.classList.add("hidden"));

async function loadAdminTables() {
  // Invites
  const invSnap = await getDocs(collection(db, "invitations"));
  invitesTableBody.innerHTML = "";
  invSnap.forEach((d) => {
    const data = d.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${d.id}</code></td>
      <td>${data.badge || "Any"}</td>
      <td>${data.role}</td>
      <td><span class="badge ${data.used ? "badge-clarify" : "badge-approved"}">${data.used ? "Used" : "Active"}</span></td>
      <td>${data.usedBy ? `By: ${data.usedBy}` : "Unclaimed"}</td>
    `;
    invitesTableBody.appendChild(tr);
  });

  // Users
  const userSnap = await getDocs(collection(db, "users"));
  accountsTableBody.innerHTML = "";
  userSnap.forEach((d) => {
    const data = d.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${data.name}</td>
      <td><code>${data.badge}</code></td>
      <td>${data.role}</td>
      <td style="text-align:right;">
        <button class="btn btn-outline btn-sm" onclick="deleteUserAccount('${d.id}')">Delete</button>
      </td>
    `;
    accountsTableBody.appendChild(tr);
  });
}

window.handleGenerateInvite = async function () {
  const badge = document.getElementById("genBadge").value.trim().toUpperCase();
  const role = document.getElementById("genRole").value;
  const passcode = "BIO-" + Math.floor(1000 + Math.random() * 9000);

  await setDoc(doc(db, "invitations", passcode), {
    badge,
    role,
    used: false,
    createdAt: serverTimestamp()
  });

  const resDiv = document.getElementById("latestInviteResult");
  resDiv.innerHTML = `Generated Passcode: <strong>${passcode}</strong> for Badge: <strong>${badge || "Any"}</strong> (${role})`;
  resDiv.classList.remove("hidden");
  loadAdminTables();
};

window.deleteUserAccount = async function (uid) {
  if (confirm("Delete this staff profile from Firestore?")) {
    await deleteDoc(doc(db, "users", uid));
    loadAdminTables();
  }
};
// Equipment Inventory Quick Filter Handling
document.querySelectorAll(".eq-pill-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".eq-pill-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const targetType = btn.getAttribute("data-filter-type");
    if (targetType === "ALL") {
      searchInput.value = "";
      renderTable();
    } else {
      // Focus search input and label prompt for selected column
      searchInput.placeholder = `Filtering by ${btn.textContent.trim()}...`;
      searchInput.focus();
    }
  });
});