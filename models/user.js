const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

//creating a user schema
//which includes all the field required for user authentication

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },

    resetToken: String,
    expireToken: Date,

    pic: {
      type: String,
      default:
        "https://res.cloudinary.com/stringnpx/image/upload/v1603468895/nopic_qqm3js.jpg",
    },
    followers: [{ type: ObjectId, ref: "User" }],

    following: [{ type: ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

mongoose.model("User", userSchema);
