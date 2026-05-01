console.log("index.js 起動");

// =======================
// 状態保持
// =======================
let lastSummary = "";

window.openInCanvas = function (url) {
  const canvas = document.getElementById("decisionCanvas");
  if (!canvas) return;

  canvas.innerHTML = `
    <iframe 
      src="${url}" 
      style="width:100%; height:100%; border:none;">
    </iframe>
  `;
};

// =======================
// チャット入力クリア
// =======================
window.clearChatInput = function () {
  const input = document.getElementById("chatInput");
  if (input) input.value = "";
};

// =======================
// AI入力送信（簡易）
// =======================



// =======================
// AI入力クリア
// =======================
window.clearAIInput = function () {
  const input = document.getElementById("aiInput");
  if (input) input.value = "";
};

// =======================
// プレコメント送信
// =======================
window.sendPreComment = function () {
  const input = document.getElementById("preCommentInput");
  const box = document.getElementById("preCommentBox");

  if (!input || !box) return;

  const text = input.value.trim();
  if (!text) return;

  // URL判定
  const isURL = text.startsWith("http");

  if (isURL) {
    box.innerHTML += `<p><a href="#" onclick="openInCanvas('${text}')">${text}</a></p>`;
  } else {
    box.innerHTML += `<p>${text}</p>`;
  }

  input.value = "";
};

// =======================
// プレコメントクリア
// =======================
window.clearPreCommentInput = function () {
  const input = document.getElementById("preCommentInput");
  if (input) input.value = "";
};

// =======================
// サマライズ
// =======================


window.saveName = function () {
  const input = document.getElementById("usernameInput");
  if (!input) return;

  const name = input.value.trim();
  if (!name) return;

  localStorage.setItem("username", name);

  alert("Name saved");
};
window.goToPDCA = function () {
  window.location.href = "/pdca";
};

window.enterRoom = function () {
  const name = document.getElementById("usernameInput").value.trim();
  const room = document.getElementById("roomInput").value.trim();

  if (!name || !room) return;

  localStorage.setItem("username", name);

  window.location.href = `/pdca?room=${room}`;
};
