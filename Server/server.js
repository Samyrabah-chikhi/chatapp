import express from "express";
import mongoose, { trusted } from "mongoose";
import cors from "cors";
import http from "http";
import dotenv from "dotenv";

import userModel from "./model/userModel.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: trusted,
  })
);
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

app.post("/register", async (req, res) => {
  if (req.body && req.body.username && req.body.password) {
    const { username, password } = req.body;
    const userExist = await userModel.getUsersByUsername(username);
    if (userExist) {
      res.status(403).json({ message: "User already exist"});
    } else {
      const user = await userModel.createUser(req.body);
      if (user != {}) {
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