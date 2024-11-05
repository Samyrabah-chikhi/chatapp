import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const UserModel = mongoose.model("user", userSchema);

const getUsers = () => UserModel.find();
const getUsersByID = (id) => UserModel.findById(id);
const getUsersByUsername = (username) => UserModel.findOne({ username });
const createUser = (values) =>
  new UserModel(values).save().then((user) => user.toObject());
const deleteUserByID = (id) => UserModel.findOneAndDelete({ _id: id });
const updateUserByID = (id, values) =>
  UserModel.findByIdAndUpdate(id, values, { new: true });

export default {
  UserModel,
  getUsers,
  getUsersByID,
  getUsersByUsername,
  createUser,
  deleteUserByID,
  updateUserByID,
};
