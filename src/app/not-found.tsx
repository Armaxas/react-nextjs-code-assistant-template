"use client";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <motion.div
      key="not-found"
      className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex flex-col items-center bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-lg text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-4xl font-bold text-red-400 mb-2">
          404 - Page Not Found
        </h1>
        <p className="text-gray-300 mb-6 max-w-md">
          Oops! The page you are looking for does not exist or has been moved.
        </p>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md transition"
          onClick={() => router.push("/")}
        >
          Go Back Home
        </button>
      </div>
    </motion.div>
  );
}
