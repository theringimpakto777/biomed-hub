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
let currentEqFilterType = "ALL"; // Equipment Inventory Pill Filter
let activeClarifyItemId = null;

let currentPhotoBase64 = null;
let currentPdfBase64 = null;
let currentPdfFileName = null;
let videoStream = null;

// ================= DOM ELEMENTS =================
const authScreen = document.getElementById("authScreen");
const mainApp = document.getElementById("appContainer");
const authAlert = document.getElementById("authAlert");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const tabLoginBtn = document.getElementById("tabLoginBtn");
const tabSignupBtn = document.getElementById("tabSignupBtn");
const userBadge = document.getElementById("userDisplayName");
const logoutBtn = document.getElementById("btnSignOut");
const itAdminBanner = document.getElementById("itAdminBanner");
const biomedActionButtons = document.getElementById("biomedActionButtons");

// KPIs
const kpiMachines = document.getElementById("kpiActiveMachines");
const kpiParts = document.getElementById("kpiSpareParts");
const kpiPending = document.getElementById("kpiPendingApproval");
const cardMachines = document.getElementById("cardMachines");
const cardParts = document.getElementById("cardParts");

// Search & Filter (Dashboard)
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const inventoryTableBody = document.getElementById("inventoryTableBody");
const emptyNotice = document.getElementById("emptyNotice");

// Search & Filter (Equipment Inventory Page)
const eqSearchInput = document.getElementById("eqSearchInput");
const eqAreaFilter = document.getElementById("eqAreaFilter");
const equipmentTableBody = document.getElementById("equipmentTableBody");

// Sidebar & Multi-View Elements
const navDashboard = document.getElementById("navDashboard");
const navInventory = document.getElementById("navInventory");
const navSpareParts = document.getElementById("navSpareParts");
const viewDashboard = document.getElementById("viewDashboard");
const viewInventory = document.getElementById("viewInventory");
const pageTitleDisplay = document.getElementById("pageTitleDisplay");

// Add / Edit Modal Elements
const itemModal = document.getElementById("itemModal");
const modalTitle = document.getElementById("modalTitle");
const itemForm = document.getElementById("itemForm");
const editItemId = document.getElementById("editItemId");
const formItemType = document.getElementById("formItemType");
const machineFormFields = document.getElementById("machineFormFields");
const partFormFields = document.getElementById("partFormFields");
const btnAddMachine = document.getElementById("btnRegisterMachine");
const btnAddPart = document.getElementById("btnRegisterPart");
const btnQuickAddEquipment = document.getElementById("btnQuickAddEquipment");
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
if (tabLoginBtn && tabSignupBtn) {
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
}

function showAuthError(msg) {
  if (!authAlert) return;
  authAlert.textContent = msg;
  authAlert.classList.remove("hidden");
}

// Sign In Handler
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (authAlert) authAlert.classList.add("hidden");

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
}

// Staff Self-Registration Handler
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (authAlert) authAlert.classList.add("hidden");

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

      const assignedRole = invData.role || role;
      const email = badgeToInternalEmail(badge);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      // Save profile record in Firestore users collection
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name,
        badge,
        role: assignedRole,
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
}

// Sign Out Handler
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => signOut(auth));
}

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

      if (userBadge) {
        userBadge.innerHTML = `<span>👤</span> <strong>${currentUser.name}</strong> [${currentUser.badge}] (${currentUser.role})`;
      }
      if (authScreen) authScreen.classList.add("hidden");
      if (mainApp) mainApp.classList.remove("hidden");

      if (itAdminBanner) {
        if (currentUser.role === "IT Support") {
          itAdminBanner.classList.remove("hidden");
        } else {
          itAdminBanner.classList.add("hidden");
        }
      }

      initInventoryListener();
    } catch (err) {
      console.error("Session fetch error:", err);
    }
  } else {
    currentUser = null;
    if (authScreen) authScreen.classList.remove("hidden");
    if (mainApp) mainApp.classList.add("hidden");
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
    renderEquipmentTable();
  });
}

// ================= KPIS & TAB FILTERING =================
function updateKPIs() {
  const machines = inventory.filter((i) => i.type === "Machine").length;
  const parts = inventory.filter((i) => i.type === "Part").length;
  const pending = inventory.filter((i) => i.status === "Pending").length;

  if (kpiMachines) kpiMachines.textContent = machines;
  if (kpiParts) kpiParts.textContent = parts;
  if (kpiPending) kpiPending.textContent = pending;
}

function setTypeFilterTab(type) {
  if (currentTypeTab === type) {
    currentTypeTab = "ALL";
  } else {
    currentTypeTab = type;
  }

  if (cardMachines) {
    cardMachines.style.outline = currentTypeTab === "Machine" ? "2px solid var(--primary)" : "none";
  }
  if (cardParts) {
    cardParts.style.outline = currentTypeTab === "Part" ? "2px solid var(--secondary)" : "none";
  }

  renderTable();
}

if (cardMachines) {
  cardMachines.addEventListener("click", () => setTypeFilterTab("Machine"));
}
if (cardParts) {
  cardParts.addEventListener("click", () => setTypeFilterTab("Part"));
}

// ================= DASHBOARD TABLE RENDERING =================
function renderTable() {
  if (!inventoryTableBody) return;
  const q = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const stFilter = statusFilter ? statusFilter.value : "ALL";

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
    if (emptyNotice) emptyNotice.classList.remove("hidden");
    return;
  }
  if (emptyNotice) emptyNotice.classList.add("hidden");

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

if (searchInput) searchInput.addEventListener("input", renderTable);
if (statusFilter) statusFilter.addEventListener("change", renderTable);

// ================= SIDEBAR NAVIGATION SWITCHER =================
function setActiveView(activeNavBtn, targetView, titleText) {
  document.querySelectorAll(".sidebar-nav-btn").forEach(btn => btn.classList.remove("active"));
  if (activeNavBtn) activeNavBtn.classList.add("active");

  if (viewDashboard) viewDashboard.classList.add("hidden");
  if (viewInventory) viewInventory.classList.add("hidden");

  if (targetView) targetView.classList.remove("hidden");
  if (pageTitleDisplay) pageTitleDisplay.textContent = titleText;
}

if (navDashboard && viewDashboard) {
  navDashboard.addEventListener("click", () => {
    setActiveView(navDashboard, viewDashboard, "Dashboard Overview");
  });
}

if (navInventory && viewInventory) {
  navInventory.addEventListener("click", () => {
    setActiveView(navInventory, viewInventory, "Equipment Inventory Directory");
    renderEquipmentTable();
  });
}

if (navSpareParts) {
  navSpareParts.addEventListener("click", () => {
    setActiveView(navSpareParts, viewDashboard, "Spare Parts Registry");
    if (searchInput) {
      searchInput.value = "";
    }
    setTypeFilterTab("Part");
  });
}

// ================= EQUIPMENT INVENTORY SEARCH & FILTER LOGIC =================
// Pill button filtering
document.querySelectorAll("#viewInventory .eq-pill-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#viewInventory .eq-pill-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    currentEqFilterType = btn.getAttribute("data-filter-type");

    if (eqSearchInput) {
      if (currentEqFilterType === "ALL") {
        eqSearchInput.placeholder = "🔍 Search equipment directory by tag, serial, or room...";
      } else {
        eqSearchInput.placeholder = `🔍 Searching specifically by ${btn.textContent.trim()}...`;
      }
      eqSearchInput.focus();
    }
    renderEquipmentTable();
  });
});

if (eqSearchInput) {
  eqSearchInput.addEventListener("input", () => {
    renderEquipmentTable();
  });
}

if (eqAreaFilter) {
  eqAreaFilter.addEventListener("change", () => {
    renderEquipmentTable();
  });
}

// Render dedicated Equipment Inventory Table
function renderEquipmentTable() {
  const tbody = document.getElementById("equipmentTableBody");
  if (!tbody) return;

  const query = eqSearchInput ? eqSearchInput.value.toLowerCase().trim() : "";
  const selectedArea = eqAreaFilter ? eqAreaFilter.value : "ALL";

  // Filter machines from the database inventory array
  const filteredMachines = inventory.filter((item) => {
    const isMachine = item.type === "Machine" || item.type === "MACHINE" || !item.type;
    if (!isMachine) return false;

    // Filter by Area dropdown if selected
    if (selectedArea !== "ALL") {
      const locStr = (item.location || "").toLowerCase();
      if (!locStr.includes(selectedArea.toLowerCase())) return false;
    }

    if (!query) return true;

    // Filter by selected category pill
    if (currentEqFilterType === "biomedTag") {
      return (item.biomedTag || "").toLowerCase().includes(query);
    } else if (currentEqFilterType === "serialNumber") {
      return (item.identifier || item.serialNumber || "").toLowerCase().includes(query);
    } else if (currentEqFilterType === "pcNumber") {
      return (item.pcNumber || "").toLowerCase().includes(query);
    } else if (currentEqFilterType === "equipment") {
      return (item.name || "").toLowerCase().includes(query);
    } else if (currentEqFilterType === "grouping") {
      return (item.grouping || "").toLowerCase().includes(query);
    } else if (currentEqFilterType === "location") {
      return (item.location || "").toLowerCase().includes(query);
    } else if (currentEqFilterType === "ipmSchedule") {
      return (item.ipmSchedule || "").toLowerCase().includes(query);
    }

    // Default "ALL" search
    return (
      (item.biomedTag && item.biomedTag.toLowerCase().includes(query)) ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.identifier && item.identifier.toLowerCase().includes(query)) ||
      (item.pcNumber && item.pcNumber.toLowerCase().includes(query)) ||
      (item.grouping && item.grouping.toLowerCase().includes(query)) ||
      (item.location && item.location.toLowerCase().includes(query))
    );
  });

  if (filteredMachines.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-state">No equipment matching "${query}" found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredMachines.map((item) => {
    const statusClass =
      item.status === "Approved"
        ? "badge-approved"
        : item.status === "Needs Clarification"
        ? "badge-clarify"
        : "badge-pending";

    return `
      <tr>
        <td>
          <span class="badge-biomed-tag" onclick="openAssetDetailModal('${item.id}')">
            🏷️ ${item.biomedTag || "NO TAG"}
          </span>
        </td>
        <td><strong>${item.name || "Unnamed Device"}</strong></td>
        <td><code>${item.identifier || "—"}</code></td>
        <td>${item.pcNumber || "—"}</td>
        <td><span class="badge badge-machine">${item.grouping || "General"}</span></td>
        <td>${item.location || "—"}</td>
        <td>${item.ipmSchedule || "Quarterly"}</td>
        <td><span class="badge ${statusClass}">${item.status || "Pending"}</span></td>
        <td>
          <button type="button" class="btn btn-outline btn-sm" onclick="openAssetDetailModal('${item.id}')">Dossier</button>
        </td>
      </tr>
    `;
  }).join("");
}

// ================= MODAL: REGISTER MACHINE / PART =================
function openMachineModal() {
  if (!itemForm) return;
  itemForm.reset();
  editItemId.value = "";
  formItemType.value = "Machine";
  modalTitle.textContent = "Register Medical Equipment";

  if (machineFormFields) machineFormFields.classList.remove("hidden");
  if (partFormFields) partFormFields.classList.add("hidden");
  if (pdfUploadGroup) pdfUploadGroup.classList.remove("hidden");

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" });
  if (displayAcceptanceDate) displayAcceptanceDate.textContent = formattedDate;
  if (inputAcceptanceDate) inputAcceptanceDate.value = formattedDate;

  if (inputUserBadge) inputUserBadge.value = currentUser ? currentUser.badge : "";

  clearAttachmentPreviews();
  if (itemModal) itemModal.classList.remove("hidden");
}

if (btnAddMachine) btnAddMachine.addEventListener("click", openMachineModal);
if (btnQuickAddEquipment) btnQuickAddEquipment.addEventListener("click", openMachineModal);

if (btnAddPart) {
  btnAddPart.addEventListener("click", () => {
    if (!itemForm) return;
    itemForm.reset();
    editItemId.value = "";
    formItemType.value = "Part";
    modalTitle.textContent = "Register Spare Part / Consumable";

    if (machineFormFields) machineFormFields.classList.add("hidden");
    if (partFormFields) partFormFields.classList.remove("hidden");
    if (pdfUploadGroup) pdfUploadGroup.classList.add("hidden");

    clearAttachmentPreviews();
    if (itemModal) itemModal.classList.remove("hidden");
  });
}

if (closeItemModalBtn) closeItemModalBtn.addEventListener("click", () => itemModal.classList.add("hidden"));
if (cancelItemModalBtn) cancelItemModalBtn.addEventListener("click", () => itemModal.classList.add("hidden"));

// Form Submit Handler
if (itemForm) {
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
}

// Edit Existing Item
window.editItem = function (id) {
  const item = inventory.find((i) => i.id === id);
  if (!item || !itemForm) return;

  itemForm.reset();
  editItemId.value = item.id;
  formItemType.value = item.type;
  modalTitle.textContent = `Edit ${item.type}: ${item.biomedTag}`;

  if (item.type === "Machine") {
    if (machineFormFields) machineFormFields.classList.remove("hidden");
    if (partFormFields) partFormFields.classList.add("hidden");
    if (pdfUploadGroup) pdfUploadGroup.classList.remove("hidden");

    if (displayAcceptanceDate) displayAcceptanceDate.textContent = item.acceptanceDate || "N/A";
    if (inputAcceptanceDate) inputAcceptanceDate.value = item.acceptanceDate || "";
    if (inputBiomedTag) inputBiomedTag.value = item.biomedTag || "";
    if (inputUserBadge) inputUserBadge.value = item.userBadge || "";
    if (selectGrouping) selectGrouping.value = item.grouping || "";
    if (inputName) inputName.value = item.name || "";
    if (inputModelName) inputModelName.value = item.modelName || "";
    if (inputManufacturer) inputManufacturer.value = item.manufacturer || "";
    if (inputIdentifier) inputIdentifier.value = item.identifier || "";
  } else {
    if (machineFormFields) machineFormFields.classList.add("hidden");
    if (partFormFields) partFormFields.classList.remove("hidden");
    if (pdfUploadGroup) pdfUploadGroup.classList.add("hidden");

    if (inputPartTag) inputPartTag.value = item.biomedTag || "";
    if (inputPartName) inputPartName.value = item.name || "";
    if (inputPartCompat) inputPartCompat.value = item.identifier || "";
    if (inputPartLocation) inputPartLocation.value = item.location || "";
    if (inputQuantity) inputQuantity.value = item.quantity || 1;
  }

  if (inputRemarks) inputRemarks.value = item.notes || "";

  currentPhotoBase64 = item.photoData || null;
  if (currentPhotoBase64 && photoPreviewImg && photoPreviewContainer) {
    photoPreviewImg.src = currentPhotoBase64;
    photoPreviewContainer.classList.remove("hidden");
  } else if (photoPreviewContainer) {
    photoPreviewContainer.classList.add("hidden");
  }

  currentPdfBase64 = item.pdfData || null;
  currentPdfFileName = item.pdfName || null;
  if (currentPdfBase64 && pdfFileName && pdfPreviewContainer) {
    pdfFileName.textContent = currentPdfFileName || "Attached Document.pdf";
    pdfPreviewContainer.classList.remove("hidden");
  } else if (pdfPreviewContainer) {
    pdfPreviewContainer.classList.add("hidden");
  }

  if (itemModal) itemModal.classList.remove("hidden");
};

// ================= ATTACHMENTS (PHOTO & PDF) =================
function clearAttachmentPreviews() {
  currentPhotoBase64 = null;
  currentPdfBase64 = null;
  currentPdfFileName = null;
  if (photoPreviewContainer) photoPreviewContainer.classList.add("hidden");
  if (pdfPreviewContainer) pdfPreviewContainer.classList.add("hidden");
  if (inputPhoto) inputPhoto.value = "";
  if (inputCameraCapture) inputCameraCapture.value = "";
  if (inputPdf) inputPdf.value = "";
}

if (btnTriggerGallery) btnTriggerGallery.addEventListener("click", () => inputPhoto.click());
if (btnTriggerCamera) {
  btnTriggerCamera.addEventListener("click", () => {
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
      if (inputCameraCapture) inputCameraCapture.click();
    } else {
      openWebcam();
    }
  });
}

function handleImageFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    currentPhotoBase64 = e.target.result;
    if (photoPreviewImg) photoPreviewImg.src = currentPhotoBase64;
    if (photoPreviewContainer) photoPreviewContainer.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

if (inputPhoto) inputPhoto.addEventListener("change", (e) => handleImageFile(e.target.files[0]));
if (inputCameraCapture) inputCameraCapture.addEventListener("change", (e) => handleImageFile(e.target.files[0]));
if (removePhotoBtn) {
  removePhotoBtn.addEventListener("click", () => {
    currentPhotoBase64 = null;
    if (photoPreviewContainer) photoPreviewContainer.classList.add("hidden");
  });
}

if (inputPdf) {
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
      if (pdfFileName) pdfFileName.textContent = file.name;
      if (pdfPreviewContainer) pdfPreviewContainer.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });
}

if (removePdfBtn) {
  removePdfBtn.addEventListener("click", () => {
    currentPdfBase64 = null;
    currentPdfFileName = null;
    if (pdfPreviewContainer) pdfPreviewContainer.classList.add("hidden");
    if (inputPdf) inputPdf.value = "";
  });
}

// Desktop Live Webcam
async function openWebcam() {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (cameraVideo) cameraVideo.srcObject = videoStream;
    if (liveCameraModal) liveCameraModal.classList.remove("hidden");
  } catch (err) {
    if (inputCameraCapture) inputCameraCapture.click();
  }
}

function stopWebcam() {
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
    videoStream = null;
  }
  if (liveCameraModal) liveCameraModal.classList.add("hidden");
}

if (btnCaptureShutter) {
  btnCaptureShutter.addEventListener("click", () => {
    if (!cameraVideo || !cameraCanvas) return;
    cameraCanvas.width = cameraVideo.videoWidth;
    cameraCanvas.height = cameraVideo.videoHeight;
    const ctx = cameraCanvas.getContext("2d");
    ctx.drawImage(cameraVideo, 0, 0);
    currentPhotoBase64 = cameraCanvas.toDataURL("image/jpeg", 0.85);
    if (photoPreviewImg) photoPreviewImg.src = currentPhotoBase64;
    if (photoPreviewContainer) photoPreviewContainer.classList.remove("hidden");
    stopWebcam();
  });
}

if (btnCancelCamera) btnCancelCamera.addEventListener("click", stopWebcam);
if (closeLiveCameraBtn) closeLiveCameraBtn.addEventListener("click", stopWebcam);

// ================= DOSSIER DETAIL MODAL =================
window.openAssetDetailModal = function (id) {
  const item = inventory.find((i) => i.id === id);
  if (!item) return;

  if (detailTypeBadge) {
    detailTypeBadge.textContent = item.type;
    detailTypeBadge.className = `badge ${item.type === "Machine" ? "badge-machine" : "badge-part"}`;
  }
  if (detailAssetName) detailAssetName.textContent = item.name;
  if (detailBiomedTag) detailBiomedTag.textContent = item.biomedTag || "—";
  if (detailIdentifier) detailIdentifier.textContent = item.identifier || "—";
  if (detailLocation) detailLocation.textContent = item.location || "—";
  if (detailSubmittedBy) detailSubmittedBy.textContent = item.submittedBy || "Unknown Staff";
  if (detailNotes) detailNotes.textContent = item.notes || "No technical remarks logged.";

  if (detailStatusContainer) {
    detailStatusContainer.innerHTML = `<span class="badge ${
      item.status === "Approved"
        ? "badge-approved"
        : item.status === "Needs Clarification"
        ? "badge-clarify"
        : "badge-pending"
    }">${item.status}</span>`;
  }

  if (detailPhotoContainer) {
    if (item.photoData) {
      detailPhotoContainer.innerHTML = `
        <img src="${item.photoData}" style="max-height:220px; border-radius:6px; cursor:zoom-in; border:1px solid #cbd5e1;" 
             onclick="openLightbox('${item.photoData}', '${item.name}')" />
      `;
    } else {
      detailPhotoContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No photo uploaded.</p>`;
    }
  }

  if (detailPdfCard && detailPdfContainer) {
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
  }

  if (assetDetailModal) assetDetailModal.classList.remove("hidden");
};

if (closeDetailModalBtn) closeDetailModalBtn.addEventListener("click", () => assetDetailModal.classList.add("hidden"));
if (closeDetailModalBottomBtn) closeDetailModalBottomBtn.addEventListener("click", () => assetDetailModal.classList.add("hidden"));

// Lightbox
window.openLightbox = function (src, title) {
  if (imageViewerImg) imageViewerImg.src = src;
  const titleEl = document.getElementById("imageViewerTitle");
  if (titleEl) titleEl.textContent = title;
  if (imageViewerModal) imageViewerModal.classList.remove("hidden");
};
if (closeImageViewerBtn) closeImageViewerBtn.addEventListener("click", () => imageViewerModal.classList.add("hidden"));

// ================= SUPERVISOR ACTIONS =================
window.approveItem = async function (id) {
  if (confirm("Approve this asset for clinical service?")) {
    await updateDoc(doc(db, "inventory", id), {
      status: "Approved",
      approvedBy: currentUser ? currentUser.name : "Supervisor",
      approvedAt: serverTimestamp()
    });
  }
};

window.openClarifyModal = function (id) {
  activeClarifyItemId = id;
  if (clarifyNoteInput) clarifyNoteInput.value = "";
  if (clarifyModal) clarifyModal.classList.remove("hidden");
};

if (submitClarifyBtn) {
  submitClarifyBtn.addEventListener("click", async () => {
    if (!activeClarifyItemId || !clarifyNoteInput) return;
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
}

if (cancelClarifyBtn) cancelClarifyBtn.addEventListener("click", () => clarifyModal.classList.add("hidden"));
if (closeClarifyModalBtn) closeClarifyModalBtn.addEventListener("click", () => clarifyModal.classList.add("hidden"));

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
  if (accountsModal) accountsModal.classList.remove("hidden");
  loadAdminTables();
};

if (closeAccountsModalBtn) closeAccountsModalBtn.addEventListener("click", () => accountsModal.classList.add("hidden"));
if (closeAccountsBtn) closeAccountsBtn.addEventListener("click", () => accountsModal.classList.add("hidden"));

async function loadAdminTables() {
  if (!invitesTableBody || !accountsTableBody) return;
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
  const badgeInput = document.getElementById("genBadge");
  const roleInput = document.getElementById("genRole");
  if (!badgeInput || !roleInput) return;

  const badge = badgeInput.value.trim().toUpperCase();
  const role = roleInput.value;
  const passcode = "BIO-" + Math.floor(1000 + Math.random() * 9000);

  await setDoc(doc(db, "invitations", passcode), {
    badge,
    role,
    used: false,
    createdAt: serverTimestamp()
  });

  const resDiv = document.getElementById("latestInviteResult");
  if (resDiv) {
    resDiv.innerHTML = `Generated Passcode: <strong>${passcode}</strong> for Badge: <strong>${badge || "Any"}</strong> (${role})`;
    resDiv.classList.remove("hidden");
  }
  loadAdminTables();
};

window.deleteUserAccount = async function (uid) {
  if (confirm("Delete this staff profile from Firestore?")) {
    await deleteDoc(doc(db, "users", uid));
    loadAdminTables();
  }
};