import 'dotenv/config';
import express from 'express';
import connectDB from './db';
import globalRouter from './global-router';
import { logger } from './logger';
import { Server } from "socket.io";
import { createServer } from "node:http";
import ChatModel from './auth/models/Chat';
import cors from 'cors';


const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

//list of online users
const onlineUsers: object = {};

connectDB();

app.use(cors());
app.use(logger);
app.use(express.json());
app.use('/api/v1/', globalRouter);
app.get('/api/events', (request, response) => {
  response.send("Hello, world");
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

//web sockets
app.get("/send-notification-to-users", (req, res) => {
  const room = req.query.room as string;
  io.to("room-1").to("room-2").emit("hello", "world");
  res.send("Hello World");
});

io.on("connection", (socket) => {
  console.log("a user connected");


  socket.on("join-room", (room: string) => {

    socket.join(room);
    console.log(`User joined room: ${room}`);
  });

  socket.on("user-online", (email: string) => {
    console.log(email);
    if (onlineUsers[socket.id] !== email) {
      onlineUsers[socket.id] = email
      console.log(onlineUsers)
      io.emit("updateUserStatus", Object.values(onlineUsers));
    }
  });

  socket.on("disconnect", () => {
    console.log("a user disconnected");
    delete onlineUsers[socket.id];
    io.emit("updateUserStatus", onlineUsers);
    console.log(onlineUsers);

  });

  socket.on("send-typing", (room: string, email: string, isTyping: boolean) => {
  
    io.to(room).emit("receive-typing", email, isTyping);
  });

  socket.on("send-message", async (room: string, email: string, message: string) => {
    const fullMessage = `${email}: ${message}`;
    try {
      let chat = await ChatModel.findOne({ participants: { $all: [room, email] } });
      if (chat) {
        chat.messages.push({ participant: email, text: message });
        await chat.save();
      } else {
        chat = new ChatModel({
          participants: [room, email],
          messages: [{ participant: email, text: message }]
        });
        await chat.save();
      }
    } catch (error) {
      console.error('Error saving message to database:', error);
    }

    io.to(room).emit("receive-message", fullMessage);
    console.log(fullMessage);
  });
});

server.listen(PORT, () => {
  console.log(`Server runs at http://localhost:${PORT}`);
});
