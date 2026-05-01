const socket = io();



// 元のsendChatを保持
const originalSend = window.sendChat;

// 上書き（拡張）
window.sendChat = function () {
  const input = document.getElementById("chatInput");
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  // socket送信
  socket.emit("send-message", message);

  // 元の処理も実行（これが重要）
  if (originalSend) originalSend();
};
