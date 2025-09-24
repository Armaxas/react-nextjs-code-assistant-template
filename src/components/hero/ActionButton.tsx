"use client";
import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  icon: LucideIcon;
  text: string;
  gradient: string;
  onClick: () => void;
}

export const ActionButton = ({
  icon: Icon,
  text,
  onClick,
  gradient,
}: ActionButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${gradient} 
    relative group overflow-hidden backdrop-blur-sm`}
    onClick={onClick}
  >
    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity" />
    <Icon className="w-5 h-5 text-white" />
    <span className="text-white font-medium">{text}</span>
  </motion.button>
);
