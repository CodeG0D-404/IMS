import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL,
      role: "ADMIN"
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      process.exit();
    }

    await User.create({
      role: "ADMIN",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });

    console.log("Admin created successfully.");
    console.log("Email:", process.env.ADMIN_EMAIL);
    console.log("Password:", process.env.ADMIN_PASSWORD);

    process.exit();

  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();