import supabase from "../config/supabaseClient.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";
import { v4 as uuidv4 } from "uuid";

export const signup = async (req, res) => {

  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabase
    .from("users1")
    .insert([
      {
        id: uuidv4(),
        name,
        email,
        password: hashedPassword,
        balance: 10000
      }
    ]);

  if (error) {
    return res.status(400).json(error);
  }

  res.json({ message: "User created successfully" });

};

export const login = async (req, res) => {

  const { email, password } = req.body;

  const { data } = await supabase
    .from("users1")
    .select("*")
    .eq("email", email);

  const user = data[0];

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({ message: "Invalid password" });
  }

  const token = generateToken(user);

  res.json({ token });

};