import express from "express";
import mongoose, { trusted } from "mongoose";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

import userModel from "./model/userModel.js";

dotenv.config();

const users = {};

const app = express();
const server = http.createServer(app);

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

const io = new Server(server);

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("disconnect", () => {
    console.log("a user disconnected");
  });

  socket.on("setUsername", (username) => {
    users[socket.id] = username.username;
  });

  socket.on("message", (msg) => {
    io.emit("message", msg, users[socket.id]);
  });
});

const PORT = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGO_URL;

mongoose
  .connect(MONGO_URL)
  .then(() => {
    console.log("Connected database successfully");

    server.listen(PORT, () => {
      console.log("Server listening on PORT ", PORT);
    });
  })
  .catch((err) => console.log(err));

app.get("/home", (req, res) => {
  if (req.cookies.user) {
    res.json({ message: "Welcome" });
  } else {
    res.status(401).json({ message: "Permission denied" });
  }
});

app.post("/register", async (req, res) => {
  if (req.body && req.body.username && req.body.password) {
    const { username, password } = req.body;
    const userExist = await userModel.getUsersByUsername(username);
    if (userExist) {
      res.status(403).json({ message: "User already exist" });
    } else {
      const user = await userModel.createUser(req.body);
      if (user != {}) {
        res.cookie("user", username, { maxAge: 999999999, httpOnly: true });
        res.json({ message: "succesful", user });
      } else {
        res.status(501).json({ message: "couldn't create user" });
      }
    }
  } else {
    res.status(401).json({ message: "Not the right data" });
  }
});

app.post("/login", async (req, res) => {
  if (req.body && req.body.username && req.body.password) {
    const { username, password } = req.body;
    const user = await userModel.getUsersByUsername(username);
    if (user) {
      if (user.password == password) {
        res.cookie("user", username, { maxAge: 999999999, httpOnly: true });
        res.json({ message: "Successfuly logged in", user });
      } else {
        res.status(403).json({ message: "Incorrect password" });
      }
    } else {
      res.status(401).json({ message: "User doesn't exist" });
    }
  } else {
    res.status(401).json({ message: "Not the right data" });
  }
});

app.get("/users", async (req, res) => {
  const users = await userModel.getUsers()
  const usernames = users.map((user) => {
    return user.username
  })
  res.json({users: usernames})
});
