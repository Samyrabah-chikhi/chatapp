import express from "express";
import mongoose, { trusted } from "mongoose";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import cookie from "cookie";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import userModel from "./model/userModel.js";
import MessageModel from "./model/messageModel.js";
import conversationModel from "./model/conversationModel.js";
import { error } from "console";

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

io.on("connection", (socket) => {});

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
    if (!decoded) res.status(401).json({ error: "Unothorized! invalid token" });
    req.userID = decoded.userID;
    next();
  } catch (error) {
    return res.status(401).json({ message: "User not logged in" });
  }
};

const asignToken = (userID, expiry, res) => {
  const token = jwt.sign({ userID }, process.env.SECRET, {
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
      const hashedPW = await bcrypt.hash(password, 10);
      const user = await userModel.createUser({ username, password: hashedPW });
      if (user != {}) {
        asignToken(user._id, Number(process.env.EXPIRY), res);
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
    const userExist = await userModel.getUsersByUsername(username);
    if (userExist) {
      const passwordsMatch = await bcrypt.compare(password, userExist.password);
      if (passwordsMatch) {
        asignToken(userExist._id, Number(process.env.EXPIRY), res);
        const userFiltered = {
          _id: userExist._id,
          username: userExist.username,
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
  let usernames = users.map((user) => {
    return { username: user.username, id: user._id };
  });
  return res.json({ users: usernames });
});

app.post("/send/:id", authentificationMiddleWare, async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverID } = req.params;
    const senderID = req.userID;

    let conversation = await conversationModel.findOne({
      participants: { $all: [senderID, receiverID] },
    });
    if (!conversation) {
      conversation = await conversationModel.create({
        participants: [senderID, receiverID],
      });
    }

    const newMsg = await MessageModel.create({
      senderID: senderID,
      receiverID: receiverID,
      message: message,
    });
    if (newMsg) {
      conversation.messages.push(newMsg._id);
    }

    await Promise.all([await conversation.save(), await newMsg.save()]);

    return res.status(201).json(newMsg);
  } catch (e) {
    console.log("Error sending msg: ", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

app.get("/:id", authentificationMiddleWare, async (req, res) => {
  try {
    const { id: userChat } = req.params;
    const userCurrent = req.userID;

    if(userChat == userCurrent) return res.status(200).json({})

    const conversation = await conversationModel
      .findOne({
        participants: { $all: [userChat, userCurrent] },
      })
      .populate("messages");
      
    console.log(conversation);
    if (!conversation) {
      return res.status(200).json({});
    } else {
      return res.status(200).json(conversation.messages);
    }
  } catch (e) {
    console.log("error: \n", e);
    return res.status(500).json({ error: "Internal error" });
  }
});
