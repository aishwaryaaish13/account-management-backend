import supabase from "../config/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";

export const getBalance = async (req, res) => {

  const { data } = await supabase
    .from("users1")
    .select("balance")
    .eq("id", req.user.id)
    .single();

  res.json(data);

};

export const getUsers = async (req, res) => {

  const { data } = await supabase
    .from("users1")
    .select("id,name,email");

  res.json(data);

};

export const transferMoney = async (req, res) => {
  try {
    const { receiverId, amount } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid transfer details" });
    }

    const { data: sender, error: senderError } = await supabase
      .from("users1")
      .select("*")
      .eq("id", senderId)
      .single();

    if (senderError || !sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const { data: receiver, error: receiverError } = await supabase
      .from("users1")
      .select("*")
      .eq("id", receiverId)
      .single();

    if (receiverError || !receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    await supabase
      .from("users1")
      .update({ balance: sender.balance - amount })
      .eq("id", senderId);

    await supabase
      .from("users1")
      .update({ balance: receiver.balance + amount })
      .eq("id", receiverId);

    await supabase
      .from("transactions")
      .insert([
        {
          id: uuidv4(),
          sender_id: senderId,
          receiver_id: receiverId,
          amount,
          transaction_type: "debit"
        },
        {
          id: uuidv4(),
          sender_id: senderId,
          receiver_id: receiverId,
          amount,
          transaction_type: "credit"
        }
      ]);

    res.json({ message: "Transfer successful" });
  } catch (err) {
    console.error("Transfer error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const getStatement = async (req, res) => {
  const userId = req.user.id;

  
  const { data: user } = await supabase
    .from("users1")
    .select("balance")
    .eq("id", userId)
    .single();

  
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: true });

  if (!transactions) return res.json([]);

  
  let runningBalance = user.balance;
  const withBalance = [...transactions].reverse().map(t => {
    const balanceAfter = runningBalance;
    if (t.transaction_type === "credit" && t.receiver_id === userId) {
      runningBalance -= Number(t.amount); 
    } else if (t.transaction_type === "debit" && t.sender_id === userId) {
      runningBalance += Number(t.amount); 
    }
    return { ...t, balance_after: balanceAfter };
  });

  
  res.json(withBalance);
};
