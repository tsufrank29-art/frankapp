const user = { nickname: "玩家A" };

let rooms = [
  {
    id: "r1",
    name: "策略聯盟A",
    intro: "短線為主，嚴守停損",
    cycle: "短線波段",
    creator: "高手Eric",
    memberCount: 86,
    operations: [
      {
        id: "r1-1",
        code: "2412",
        name: "中華電",
        shares: 10,
        date: "2024-06-15",
        action: "買進",
        notes: "守季線布局",
        comments: ["期待填息"]
      },
      {
        id: "r1-2",
        code: "2330",
        name: "台積電",
        shares: 5,
        date: "2024-06-10",
        action: "加碼",
        notes: "AI需求續強",
        comments: []
      },
      {
        id: "r1-3",
        code: "2317",
        name: "鴻海",
        shares: 20,
        date: "2024-06-05",
        action: "買進",
        notes: "NB回溫",
        comments: []
      }
    ]
  },
  {
    id: "r2",
    name: "價值投資研究院",
    intro: "以財報選股",
    cycle: "價值投資",
    creator: "晨星",
    memberCount: 132,
    operations: [
      {
        id: "r2-1",
        code: "2884",
        name: "玉山金",
        shares: 30,
        date: "2024-06-12",
        action: "加碼",
        notes: "殖利率保護",
        comments: []
      },
      {
        id: "r2-2",
        code: "1303",
        name: "南亞",
        shares: 12,
        date: "2024-05-29",
        action: "買進",
        notes: "塑化循環回升",
        comments: []
      }
    ]
  }
];

let createdRoom = null;
let joinedRoomIds = new Set();
let visitorRoomId = null;

const screens = {
  overview: document.getElementById("screen-overview"),
  created: document.getElementById("screen-created"),
  joined: document.getElementById("screen-joined"),
  visitor: document.getElementById("screen-visitor"),
  profile: document.getElementById("screen-profile")
};

const tabs = Array.from(document.querySelectorAll(".tab"));
const toastEl = document.getElementById("toast");
const backdrop = document.getElementById("modalBackdrop");
const modals = {
  create: document.getElementById("modalCreateRoom"),
  record: document.getElementById("modalRecord"),
  comment: document.getElementById("modalComment"),
  confirm: document.getElementById("modalConfirm")
};

const createRoomForm = document.getElementById("createRoomForm");
const recordForm = document.getElementById("recordForm");
const commentForm = document.getElementById("commentForm");
const confirmButton = document.getElementById("confirmButton");

let confirmAction = null;

// Utility
const today = () => new Date().toISOString().slice(0, 10);
const clone = (obj) => JSON.parse(JSON.stringify(obj));

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2000);
}

function openModal(modal) {
  backdrop.classList.remove("hidden");
  Object.values(modals).forEach((m) => m.classList.add("hidden"));
  modal.classList.remove("hidden");
}

function closeModal() {
  backdrop.classList.add("hidden");
  Object.values(modals).forEach((m) => m.classList.add("hidden"));
}

backdrop.addEventListener("click", (e) => {
  if (e.target === backdrop) closeModal();
});

Array.from(document.querySelectorAll("[data-close]"))
  .forEach((btn) => btn.addEventListener("click", closeModal));

document.getElementById("createRoomButton").addEventListener("click", () => {
  createRoomForm.reset();
  openModal(modals.create);
});

document.getElementById("homeButton").addEventListener("click", () => navigate("overview"));
document.getElementById("profileButton").addEventListener("click", () => navigate("profile"));

tabs.forEach((tab) =>
  tab.addEventListener("click", () => navigate(tab.dataset.target))
);

createRoomForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(createRoomForm);
  const name = formData.get("name").trim();
  const cycle = formData.get("cycle");
  const intro = formData.get("intro").trim();
  if (!name || !cycle) return;

  createdRoom = {
    id: `c-${Date.now()}`,
    name,
    intro,
    cycle,
    creator: user.nickname,
    memberCount: 1,
    operations: []
  };
  rooms.push(createdRoom);
  showToast("成功創建");
  closeModal();
  navigate("created");
  renderAll();
});

recordForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!createdRoom) {
    showToast("請先創建房間");
    return;
  }
  const formData = new FormData(recordForm);
  const payload = {
    id: formData.get("recordId") || `op-${Date.now()}`,
    code: formData.get("code"),
    name: formData.get("name"),
    shares: Number(formData.get("shares")),
    date: formData.get("date"),
    action: formData.get("action"),
    notes: formData.get("notes") || "",
    comments: []
  };
  const index = createdRoom.operations.findIndex((op) => op.id === payload.id);
  if (index >= 0) {
    createdRoom.operations[index] = { ...createdRoom.operations[index], ...payload };
  } else {
    createdRoom.operations.unshift(payload);
  }
  showToast("操作記錄已更新");
  closeModal();
  renderCreated();
  updateProfile();
});

commentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(commentForm);
  const roomId = formData.get("targetRoom");
  const recordId = formData.get("targetRecord");
  const message = formData.get("message").trim();
  if (!message) return;
  const room = rooms.find((r) => r.id === roomId);
  const record = room?.operations.find((op) => op.id === recordId);
  if (record) {
    record.comments.push(message);
    showToast("留言已送出");
    closeModal();
    renderAll();
  }
});

confirmButton.addEventListener("click", () => {
  if (typeof confirmAction === "function") confirmAction();
  confirmAction = null;
  closeModal();
});

document.getElementById("overviewSort").addEventListener("click", () => {
  rooms = sortByMember(rooms);
  renderOverview();
});

document.getElementById("joinedSort").addEventListener("click", () => {
  rooms = sortByMember(rooms);
  renderJoined();
});

document.getElementById("addRecordButton").addEventListener("click", () => {
  if (!createdRoom) return;
  recordForm.reset();
  recordForm.elements.date.value = today();
  recordForm.elements.recordId.value = "";
  document.getElementById("recordModalTitle").textContent = "新增操作記錄";
  openModal(modals.record);
});

document.getElementById("removeRoomButton").addEventListener("click", () => {
  if (!createdRoom) return;
  setupConfirm("確認移除房間", "移除後將無法復原，確認移除？", () => {
    rooms = rooms.filter((r) => r.id !== createdRoom.id);
    joinedRoomIds.delete(createdRoom.id);
    createdRoom = null;
    showToast("房間已移除");
    renderAll();
  });
});

document.getElementById("leaveRoomButton").addEventListener("click", () => {
  if (!visitorRoomId) return;
  setupConfirm("退出房間", "確認退出該房間？", () => {
    joinedRoomIds.delete(visitorRoomId);
    updateMemberCount(visitorRoomId, -1);
    visitorRoomId = null;
    showToast("已退出房間");
    navigate("joined");
    renderAll();
  });
});

function navigate(target) {
  Object.entries(screens).forEach(([key, section]) => {
    section.classList.toggle("active", key === target);
  });
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.target === target));

  if (target === "overview") renderOverview();
  if (target === "created") renderCreated();
  if (target === "joined") renderJoined();
  if (target === "profile") updateProfile();
  if (target === "visitor") renderVisitor();
}

function sortByMember(list) {
  return clone(list).sort((a, b) => b.memberCount - a.memberCount);
}

function renderOverview() {
  const container = document.getElementById("overviewList");
  container.innerHTML = "";
  const available = rooms.filter((r) => r.creator !== user.nickname);
  document.getElementById("overviewEmpty").style.display = available.length ? "none" : "block";
  available.forEach((room) => {
    const card = createRoomCard(room, "overview");
    container.appendChild(card);
  });
}

function renderJoined() {
  const container = document.getElementById("joinedList");
  container.innerHTML = "";
  const joined = rooms.filter((r) => joinedRoomIds.has(r.id));
  document.getElementById("joinedEmpty").style.display = joined.length ? "none" : "block";
  joined.forEach((room) => container.appendChild(createRoomCard(room, "joined")));
}

function renderCreated() {
  const wrapper = document.getElementById("createdContent");
  wrapper.innerHTML = "";
  const removeWrapper = document.getElementById("removeRoomWrapper");
  if (!createdRoom) {
    wrapper.innerHTML = `<div class="empty">您尚未創建房間</div>`;
    removeWrapper.style.display = "none";
    return;
  }
  removeWrapper.style.display = "flex";
  const headerCard = document.createElement("div");
  headerCard.className = "card";
  headerCard.innerHTML = `
    <div class="main">
      <div class="title-row">
        <h3>${createdRoom.name}</h3>
        <div class="badge">人數 ${createdRoom.memberCount}</div>
      </div>
      <div class="meta-grid">
        <div><span class="lead-label">操作週期</span>${createdRoom.cycle}</div>
        <div><span class="lead-label">房間介紹</span>${createdRoom.intro || "－"}</div>
      </div>
    </div>
  `;
  wrapper.appendChild(headerCard);

  if (!createdRoom.operations.length) {
    wrapper.insertAdjacentHTML("beforeend", `<div class="empty">尚未新增操作記錄</div>`);
  } else {
    createdRoom.operations
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .forEach((op) => wrapper.appendChild(createOperationCard(createdRoom.id, op, true)));
  }
}

function renderVisitor() {
  const room = rooms.find((r) => r.id === visitorRoomId);
  const container = document.getElementById("visitorContent");
  container.innerHTML = "";
  if (!room) {
    container.innerHTML = `<div class="empty">尚未新增操作記錄</div>`;
    return;
  }
  document.getElementById("visitorTitle").textContent = room.name;
  document.getElementById("visitorMeta").textContent = `房間人數 ${room.memberCount}`;
  if (!room.operations.length) {
    container.innerHTML = `<div class="empty">尚未新增操作記錄</div>`;
    return;
  }
  room.operations
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .forEach((op) => container.appendChild(createOperationCard(room.id, op, false)));
}

function updateProfile() {
  document.getElementById("profileNickname").textContent = user.nickname;
  document.getElementById("profileCreated").textContent = createdRoom ? createdRoom.name : "無";
  const joinedContainer = document.getElementById("profileJoined");
  joinedContainer.innerHTML = "";
  const joined = rooms.filter((r) => joinedRoomIds.has(r.id));
  if (!joined.length) {
    joinedContainer.textContent = "無";
  } else {
    joined.forEach((room) => {
      const row = document.createElement("div");
      row.textContent = `${room.name}（${room.creator}）`;
      joinedContainer.appendChild(row);
    });
  }
}

function createRoomCard(room, context) {
  const card = document.createElement("div");
  card.className = "card";
  const opPreview = room.operations
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3)
    .map((op) => `${op.code} ${op.name}`)
    .join("、") || "無";

  card.innerHTML = `
    <div class="main">
      <div class="title-row">
        <h3>${room.name}</h3>
        <span class="badge">${room.creator}</span>
      </div>
      <div class="meta-grid">
        <div><span class="lead-label">房間人數</span>${room.memberCount}</div>
        <div><span class="lead-label">操作週期</span>${room.cycle}</div>
        <div><span class="lead-label">最近標的</span>${opPreview}</div>
      </div>
    </div>
  `;

  const actions = document.createElement("div");
  actions.className = "actions";
  const isJoined = joinedRoomIds.has(room.id);
  const btn = document.createElement("button");
  if (context === "overview") {
    btn.textContent = isJoined ? "進入房間" : "加入房間";
    btn.className = isJoined ? "primary" : "outline";
    btn.addEventListener("click", () => {
      if (isJoined) {
        visitorRoomId = room.id;
        navigate("visitor");
      } else {
        joinedRoomIds.add(room.id);
        updateMemberCount(room.id, 1);
        showToast("加入成功");
        renderOverview();
        renderJoined();
      }
    });
  } else {
    btn.textContent = "進入房間";
    btn.className = "primary";
    btn.addEventListener("click", () => {
      visitorRoomId = room.id;
      navigate("visitor");
    });
  }
  actions.appendChild(btn);
  card.appendChild(actions);
  return card;
}

function createOperationCard(roomId, op, editable) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="main">
      <div class="title-row">
        <h3>${op.code} ${op.name}</h3>
        <span class="badge">${op.action}</span>
      </div>
      <div class="meta-grid">
        <div><span class="lead-label">張數</span>${op.shares}</div>
        <div><span class="lead-label">日期</span>${op.date}</div>
        <div><span class="lead-label">操作說明</span>${op.notes || "－"}</div>
      </div>
      <div class="tag-list"><span class="lead-label">留言</span></div>
    </div>
  `;

  const actions = document.createElement("div");
  actions.className = "actions";

  if (editable) {
    const editBtn = document.createElement("button");
    editBtn.textContent = "編輯";
    editBtn.className = "outline";
    editBtn.addEventListener("click", () => openRecordForEdit(op));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "刪除";
    deleteBtn.className = "danger";
    deleteBtn.addEventListener("click", () => {
      setupConfirm("確認刪除", "確認刪除該操作記錄？", () => {
        createdRoom.operations = createdRoom.operations.filter((item) => item.id !== op.id);
        showToast("已刪除");
        renderCreated();
        updateProfile();
      });
    });

    actions.append(editBtn, deleteBtn);
  }

  const commentBtn = document.createElement("button");
  commentBtn.textContent = "我要留言";
  commentBtn.className = "ghost";
  commentBtn.addEventListener("click", () => openComment(roomId, op.id));
  actions.appendChild(commentBtn);

  card.appendChild(actions);

  const commentList = document.createElement("div");
  commentList.className = "comment-list";
  if (!op.comments.length) {
    commentList.innerHTML = `<div class="comment-item">目前沒有留言</div>`;
  } else {
    op.comments.forEach((msg) => {
      const item = document.createElement("div");
      item.className = "comment-item";
      item.textContent = msg;
      commentList.appendChild(item);
    });
  }
  card.appendChild(commentList);

  return card;
}

function openRecordForEdit(op) {
  recordForm.reset();
  recordForm.elements.recordId.value = op.id;
  recordForm.elements.code.value = op.code;
  recordForm.elements.name.value = op.name;
  recordForm.elements.shares.value = op.shares;
  recordForm.elements.date.value = op.date;
  recordForm.elements.action.value = op.action;
  recordForm.elements.notes.value = op.notes;
  document.getElementById("recordModalTitle").textContent = "編輯操作記錄";
  openModal(modals.record);
}

function openComment(roomId, recordId) {
  commentForm.reset();
  commentForm.elements.targetRoom.value = roomId;
  commentForm.elements.targetRecord.value = recordId;
  openModal(modals.comment);
}

function setupConfirm(title, message, action) {
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMessage").textContent = message;
  confirmAction = action;
  openModal(modals.confirm);
}

function updateMemberCount(roomId, diff) {
  const room = rooms.find((r) => r.id === roomId);
  if (room) room.memberCount = Math.max(0, room.memberCount + diff);
}

function renderAll() {
  renderOverview();
  renderCreated();
  renderJoined();
  updateProfile();
  if (visitorRoomId) renderVisitor();
}

// Init
recordForm.elements.date.value = today();
renderAll();
