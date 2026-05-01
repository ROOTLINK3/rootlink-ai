
console.log("🔥 THIS SERVER RUNNING");

import path from "path";

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ルート
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "dashboard.html"));
});

app.get("/api", (req, res) => {
  res.json({ message: "ok" });
});

// AI API
app.post("/ai", async (req, res) => {
  try {
    const userInput = req.body.message;

    console.log("📩 受信:", userInput);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: userInput
      })
    });

    const data = await response.json();

    console.log("🤖 APIレス:", data);

    res.json(data);

  } catch (error) {
    console.error("❌ エラー:", error);
    res.status(500).send("サーバーエラー");
  }
});
app.post("/summarize", async (req, res) => {
  try {
    const text = req.body.text;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `以下の議論を構造化して要約してください：

${text}

出力形式：
- 議論テーマ
- 合意点
- 未解決
- 次のアクション`
      })
    });

    const data = await response.json();

    let summary = "";

    if (data.output_text) {
      summary = data.output_text;
    } else if (data.output && data.output[0]?.content) {
      summary = data.output[0].content
        .map(c => c.text)
        .filter(Boolean)
        .join("");
    }

    res.json({ summary });

  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});
// PDCA
app.get("/pdca", (req, res) => {
  res.sendFile(path.resolve("public/pdca.html"));
});

const PORT = process.env.PORT || 3000;

import http from "http";
import { Server } from "socket.io";

const server = http.createServer(app);
const io = new Server(server);

let users = [];

io.on("connection", (socket) => {
  console.log("🟢 ユーザー接続:", socket.id);

  // 追加
  users.push(socket.id);

  // 全員に送信
  io.emit("users", users);
socket.on("join-room", (room) => {
    socket.join(room);
  });

  socket.on("send-message", (msg) => {
  io.to(msg.room).emit("receive-message", msg);
  });

  // 切断処理
  socket.on("disconnect", () => {
    console.log("🔴 切断:", socket.id);

    users = users.filter(id => id !== socket.id);

    io.emit("users", users);
  });
});


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

