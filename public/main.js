const username = localStorage.getItem("username");

if (!username) {
  alert("ダッシュボードから入室してください");
  window.location.href = "/dashboard.html";
}

// ==========================
// Socket初期化
// ==========================
const params = new URLSearchParams(window.location.search);
const room = params.get("room") || "default";

window.socket = window.socket || io();

let myId = null;

window.socket.on("connect", () => {
  myId = window.socket.id;
  console.log("🟢 Socket接続成功:", myId);
});
window.socket.on("connect", () => {
  myId = window.socket.id;

  // 👇ここに追加
  window.socket.emit("join-room", room);

  console.log("🟢 Socket接続成功:", myId);
});

window.socket.on("users", (users) => {
  const count = users.length;

  const el = document.getElementById("users");
  if (!el) return;

  if (count <= 1) {
    el.innerText = "You only";
  } else {
    el.innerText = `You + ${count - 1} others`;
  }
});

// ==========================
// メッセージ受信
// ==========================
window.socket.on("receive-message", (data) => {
  const chat = document.getElementById("chatBox");
  if (!chat) return;

  let message = "";

  // パターン分岐
  if (typeof data === "string") {
    message = data;
  } else if (data.message) {
    // 自分のは無視
    if (data.id === myId) return;
    message = data.message;
  }

  chat.innerHTML += `<p><b>${data.name || "Other"}:</b> ${message}</p>`;
});


// ==========================
// チャット送信
// ==========================
window.sendChat = function () {
  const input = document.getElementById("chatInput");
  const chat = document.getElementById("chatBox");

  if (!input || !chat) return;

  const message = input.value.trim();
  if (!message) return;

  // ID付きで送信
  window.socket.emit("send-message", {
  id: myId,
    name: username,
  message: message,
  room: room   // ←これ追加
});

  // 自分表示
  chat.innerHTML += `<p><b>${username}:</b> ${message}</p>`;
  input.value = "";
};
window.summarizeChat = async function () {
  const chat = document.getElementById("chatBox");
  const canvas = document.getElementById("decisionCanvas");

  if (!chat || !canvas) return;

  const text = chat.innerText;

  try {
    const res = await fetch("/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    const data = await res.json();

    canvas.innerHTML += `
      <div>
        <b>Summary:</b><br>
        ${data.summary}
      </div>
    `;

  } catch (err) {
    console.error(err);
  }
}
// ==========================
// チャット入力クリア
// ==========================
window.clearChatInput = function () {
  const input = document.getElementById("chatInput");
  if (input) input.value = "";
};

// ==========================
// AI入力
// ==========================
window.sendAI = async function () {
  const input = document.getElementById("aiInput");
  const display = document.getElementById("aiDisplay");

  if (!input || !display) return;

  const message = input.value.trim();
  if (!message) return;

  display.innerHTML += `<p><b>You:</b> ${message}</p>`;
  input.value = "";

  try {
    const res = await fetch("/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();

    let reply = "Error";

    if (data.output_text) {
      reply = data.output_text;
    } else if (data.output && data.output[0]?.content) {
      reply = data.output[0].content
        .map(c => c.text)
        .filter(Boolean)
        .join("");
    }

    display.innerHTML += `<p><b>AI:</b> ${reply}</p>`;

  } catch (err) {
    console.error(err);
    display.innerHTML += `<p style="color:red;">通信エラー</p>`;
  }
};

// ==========================
// AI入力クリア
// ==========================
window.clearAIInput = function () {
  const input = document.getElementById("aiInput");
  if (input) input.value = "";
};

// ==========================
// アジェンダ作成
// ==========================
window.createAgenda = function () {
  const agenda = document.getElementById("agendaInput");
  const context = document.getElementById("contextInput");
  const canvas = document.getElementById("decisionCanvas");

  if (!agenda || !canvas) return;

  canvas.innerHTML += `
    <div><b>Agenda:</b> ${agenda.value}</div>
    <div><b>Context:</b> ${context.value}</div>
  `;

  agenda.value = "";
  context.value = "";
};

// ==========================
// フェーズ
// ==========================
window.setPhase = function (phase) {
  const canvas = document.getElementById("decisionCanvas");
  if (!canvas) return;

  canvas.innerHTML += `<p><b>Phase:</b> ${phase}</p>`;
};

// ==========================
// メディア削除
// ==========================
window.clearCanvasMedia = function () {
  const canvas = document.getElementById("decisionCanvas");
  if (!canvas) return;

  const iframes = canvas.querySelectorAll("iframe");
  iframes.forEach(el => el.remove());
};

// ==========================
// ログ保存（統一版）
// ==========================
window.commitDecision = function () {
  const canvas = document.getElementById("decisionCanvas");
  if (!canvas) return;

  const content = canvas.innerText;

  let agendaMatch = content.match(/Agenda:\s*(.*)/);
  const agenda = agendaMatch ? agendaMatch[1] : "No Agenda";

  let phases = content.match(/Phase:\s*([A-Z])/g);
  let phase = "-";

  if (phases && phases.length > 0) {
    phase = phases.map(p => p.replace("Phase:", "").trim()).join(",");
  }

  const now = new Date();
  const date =
    now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0") + " " +
    String(now.getHours()).padStart(2, "0") + ":" +
    String(now.getMinutes()).padStart(2, "0");

  let logs = JSON.parse(localStorage.getItem("decisionLogs")) || [];

  logs.push({
    agenda,
    phase,
    date,
    content: canvas.innerHTML
  });

  localStorage.setItem("decisionLogs", JSON.stringify(logs));

  renderLogs();

  alert("Decision Committed");
};

// ==========================
// ログ表示
// ==========================
function renderLogs() {
  const logBox = document.getElementById("logBox");
  if (!logBox) return;

  logBox.innerHTML = "";

  let logs = JSON.parse(localStorage.getItem("decisionLogs")) || [];

  logs.forEach((log, index) => {
    const div = document.createElement("div");

    div.innerHTML = `
      <b>${log.agenda}</b><br>
      Phase: ${log.phase}<br>
      ${log.date}
    `;

    div.style.cursor = "pointer";

    div.onclick = () => {
      loadDecision(index);
    };

    logBox.appendChild(div);
  });
}

// ==========================
// ログ復元
// ==========================
function loadDecision(index) {
  const canvas = document.getElementById("decisionCanvas");
  let logs = JSON.parse(localStorage.getItem("decisionLogs")) || [];

  if (canvas && logs[index]) {
    canvas.innerHTML = logs[index].content;
  }
}

// ==========================
// 初期表示
// ==========================
window.addEventListener("load", () => {
  renderLogs();
});

function getChatLog() {
  const chat = document.getElementById("chatBox");
  if (!chat) return "";

  return chat.innerText;
}
