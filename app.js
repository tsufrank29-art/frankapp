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
        date: "2024-06-15",
        position: 20,
        entryCondition: "守季線、盤整突破",
        entryRange: { min: "115", max: "122" },
        addCondition: "突破月線加碼",
        stopLossCondition: "跌破季線",
        takeProfitCondition: "填息後收斂",
        targetPrice: 130,
        notes: "觀察大盤量能",
        comments: ["期待填息"]
      },
      {
        id: "r1-2",
        code: "2330",
        name: "台積電",
        date: "2024-06-10",
        position: 30,
        entryCondition: "靠近5日線分批",
        entryRange: { min: "855", max: "880" },
        addCondition: "突破900再加碼",
        stopLossCondition: "跌破850",
        takeProfitCondition: "950分批出",
        targetPrice: 980,
        notes: "AI需求續強",
        comments: []
      },
      {
        id: "r1-3",
        code: "2317",
        name: "鴻海",
        date: "2024-06-05",
        position: 15,
        entryCondition: "月線守穩",
        entryRange: { min: "125", max: "134" },
        addCondition: "站上半年線",
        stopLossCondition: "跌破120",
        takeProfitCondition: "145減碼",
        targetPrice: 150,
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
        date: "2024-06-12",
        position: 25,
        entryCondition: "殖利率 > 5%",
        entryRange: { min: "27", max: "29" },
        addCondition: "季線守穩加碼",
        stopLossCondition: "跌破25.5",
        takeProfitCondition: "32分批",
        targetPrice: 33,
        notes: "殖利率保護",
        comments: []
      },
      {
        id: "r2-2",
        code: "1303",
        name: "南亞",
        date: "2024-05-29",
        position: 18,
        entryCondition: "塑化循環回升",
        entryRange: { min: "72", max: "78" },
        addCondition: "站穩80後加碼",
        stopLossCondition: "跌破70",
        takeProfitCondition: "88停利",
        targetPrice: 90,
        notes: "景氣循環股",
        comments: []
      }
    ]
  }
];

let createdRoom = {
  id: "c-demo",
  name: "我的操盤計畫室",
  intro: "示範操作計畫排版",
  cycle: "中期波段",
  creator: user.nickname,
  memberCount: 12,
  operations: [
    {
      id: "c1-1",
      code: "0050",
      name: "台灣50",
      date: "2024-06-18",
      position: 20,
      entryCondition: "月線附近分批",
      entryRange: { min: "143", max: "148" },
      addCondition: "突破150加碼10%",
      stopLossCondition: "跌破140全出",
      takeProfitCondition: "156開始分批",
      targetPrice: 160,
      notes: "長期核心部位",
      comments: ["觀察量能"]
    },
    {
      id: "c1-2",
      code: "2603",
      name: "長榮",
      date: "2024-06-14",
      position: 15,
      entryCondition: "BDI續強",
      entryRange: { min: "126", max: "132" },
      addCondition: "突破季線續加",
      stopLossCondition: "跌破120",
      takeProfitCondition: "145以上分批",
      targetPrice: 150,
      notes: "運價回升行情",
      comments: []
    }
  ]
};

rooms.push(createdRoom);
let joinedRoomIds = new Set(["r1"]);
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

document.getElementById("floatingCreate").addEventListener("click", () => {
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
    date: formData.get("date"),
    position: Number(formData.get("position") || 0),
    entryCondition: formData.get("entryCondition") || "",
    entryRange: {
      min: formData.get("entryMin") || "",
      max: formData.get("entryMax") || ""
    },
    addCondition: formData.get("addCondition") || "",
    stopLossCondition: formData.get("stopLossCondition") || "",
    takeProfitCondition: formData.get("takeProfitCondition") || "",
    targetPrice: Number(formData.get("targetPrice") || 0),
    notes: formData.get("notes") || "",
    comments: []
  };
  const index = createdRoom.operations.findIndex((op) => op.id === payload.id);
  if (index >= 0) {
    createdRoom.operations[index] = { ...createdRoom.operations[index], ...payload };
  } else {
    createdRoom.operations.unshift(payload);
  }
  showToast("操作計畫已更新");
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
  document.getElementById("recordModalTitle").textContent = "新增操作計畫";
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
  headerCard.className = "card room-card";
  headerCard.innerHTML = `
    <div class="card-body">
      <div class="room-topline">
        <h3>${createdRoom.name}</h3>
        <div class="badge">房主 ${createdRoom.creator}</div>
      </div>
      <div class="room-meta">
        <span>👥 ${createdRoom.memberCount} 人</span>
        <span class="dot"></span>
        <span>⏱️ ${createdRoom.cycle}</span>
      </div>
      <div class="inline-meta">
        <span class="pill">操作週期：${createdRoom.cycle}</span>
        <span class="pill">房間介紹：${createdRoom.intro || "－"}</span>
      </div>
    </div>
  `;
  wrapper.appendChild(headerCard);

  if (!createdRoom.operations.length) {
    wrapper.insertAdjacentHTML("beforeend", `<div class="empty">尚未新增操作計畫</div>`);
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
    container.innerHTML = `<div class="empty">尚未新增操作計畫</div>`;
    return;
  }
  document.getElementById("visitorTitle").textContent = room.name;
  document.getElementById("visitorMeta").textContent = `房間人數 ${room.memberCount}`;
  if (!room.operations.length) {
    container.innerHTML = `<div class="empty">尚未新增操作計畫</div>`;
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
  card.className = "card room-card";
  const opPreview = room.operations
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3)
    .map((op) => `${op.code} ${op.name}`)
    .join("、") || "無";

  card.innerHTML = `
    <div class="card-body">
      <div class="room-topline">
        <h3>${room.name}</h3>
        <span class="badge">${room.cycle}</span>
      </div>
      <div class="room-meta">
        <span>房主 ${room.creator}</span>
        <span class="dot" aria-hidden="true"></span>
        <span>👥 ${room.memberCount} 人</span>
      </div>
      <div class="section-lead">最近標的：<strong>${opPreview}</strong></div>
      <div class="inline-meta">
        <span class="pill">⏱️ 操作週期：${room.cycle}</span>
        <span class="pill">🧭 簡介：${room.intro || "－"}</span>
      </div>
    </div>
  `;

  const actions = document.createElement("div");
  actions.className = "room-actions";
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
        updateProfile();
        visitorRoomId = room.id;
        navigate("visitor");
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
  card.className = "card op-card";
  card.innerHTML = `
    <div class="card-body">
      <div class="room-topline">
        <h3>${op.name}（${op.code}）</h3>
        <span class="badge">${op.date}</span>
      </div>
      <div class="plan-grid">
        <div class="plan-item"><span class="label">倉位配置</span><span class="value">${op.position || 0}%</span></div>
        <div class="plan-item"><span class="label">進場價格區間</span><span class="value">${op.entryRange?.min || "－"} ～ ${op.entryRange?.max || "－"}</span></div>
        <div class="plan-item"><span class="label">目標價</span><span class="value">${op.targetPrice || "－"}</span></div>
      </div>
      <div class="plan-conditions">
        <div><strong>進場條件：</strong>${op.entryCondition || "－"}</div>
        <div><strong>加碼條件：</strong>${op.addCondition || "－"}</div>
        <div><strong>止損條件：</strong>${op.stopLossCondition || "－"}</div>
        <div><strong>停利條件：</strong>${op.takeProfitCondition || "－"}</div>
        <div><strong>備註說明：</strong>${op.notes || "－"}</div>
      </div>
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
      setupConfirm("確認刪除", "確認刪除該操作計畫？", () => {
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
  const commentTitle = document.createElement("div");
  commentTitle.className = "text-muted";
  commentTitle.textContent = "留言";
  commentList.appendChild(commentTitle);
  if (!op.comments.length) {
    const empty = document.createElement("div");
    empty.className = "comment-item";
    empty.textContent = "目前沒有留言";
    commentList.appendChild(empty);
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
  recordForm.elements.date.value = op.date;
  recordForm.elements.position.value = op.position;
  recordForm.elements.entryCondition.value = op.entryCondition;
  recordForm.elements.entryMin.value = op.entryRange?.min || "";
  recordForm.elements.entryMax.value = op.entryRange?.max || "";
  recordForm.elements.addCondition.value = op.addCondition;
  recordForm.elements.stopLossCondition.value = op.stopLossCondition;
  recordForm.elements.takeProfitCondition.value = op.takeProfitCondition;
  recordForm.elements.targetPrice.value = op.targetPrice;
  recordForm.elements.notes.value = op.notes;
  document.getElementById("recordModalTitle").textContent = "編輯操作計畫";
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
