import express from "express";
import mongoose, { trusted } from "mongoose";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import cookie from "cookie";
import jwt from "jsonwebtoken";

import userModel from "./model/userModel.js";

dotenv.config();

let users = [];

const app = express();
const server = http.createServer(app);

app.use(cookieParser(process.env.SECRET));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

const io = new Server(server);

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    users = users.filter((user) => user !== socket.id);
    io.emit("disconnected-user", users);
  });

  socket.on("join", (user) => {});

  socket.on("active-user", (username) => {
    users.push(username);
    io.emit("active-user", users);
  });

  socket.on("message", (msg, to) => {
    const cookies = socket.request.headers.cookie;
    const parsedCookies = cookies ? cookie.parse(cookies) : {};
    const username = parsedCookies.user;

    console.log("username :", username);
    console.log("to :", to);
    console.log("msg :", msg);
    io.emit("message", msg, to, username);
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

const authentificationMiddleWare = async (req, res, next) => {
  const token = req.signedCookies.token;
  if (!token) return res.status(401).json({ error: "Access denied" });
  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "User not logged in" });
  }
};

const asignToken = (username, expiry, res) => {
  const token = jwt.sign({ username: username }, process.env.SECRET, {
    expiresIn: expiry,
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    maxAge: expiry * 1000,
    signed: true,
  });
};

app.post("/logout", async (req, res) => {
  try {
    res.cookie("token", "", { maxAge: 0 });
    res.json({ message: "Logout successfully" });
  } catch (e) {
    res.status(500).json({ error: "Internal error" });
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
        asignToken(username, 5 * 60, res);
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
        asignToken(username, 5 * 60, res);
        const userFiltered = {
          _id: user._id,
          username: user.username,
        };
        res.json({ message: "Successfuly logged in", user: userFiltered });
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

app.get("/users", authentificationMiddleWare, async (req, res) => {
  const users = await userModel.getUsers();
  const usernames = users.map((user) => {
    return user.username;
  });
  res.json({ users: usernames });
});
