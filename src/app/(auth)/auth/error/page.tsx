"use client";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center bg-gray-900 border border-gray-700 p-8 rounded-lg shadow-lg">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-red-400 mb-2">Access Denied</h1>
        <p className="text-gray-300 mb-6 text-center">
          You do not have permission to view this page. Please contact
          administrator.
        </p>
        <Link
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md transition"
          href="/"
        >
          Go Back to Login
        </Link>
      </div>
    </div>
  );
}
