"use client";

import { useState, useEffect } from "react";

const WHATS_NEW_VERSION = "mvp2-2025-06-20-v1.0"; // Update this when new features are added
const STORAGE_KEY = "isc-code-connect-whats-new-seen";

export function useWhatsNew() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasSeenVersion, setHasSeenVersion] = useState(true);

  useEffect(() => {
    // Check if user has seen the current version
    const seenVersions = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    ) as string[];

    const hasSeenCurrent = seenVersions.includes(WHATS_NEW_VERSION);
    setHasSeenVersion(hasSeenCurrent);

    // Auto-show modal if user hasn't seen this version
    if (!hasSeenCurrent) {
      // Add a delay to ensure the page is fully loaded
      const timer = setTimeout(() => {
        setIsModalOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const markAsSeen = () => {
    const seenVersions = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    ) as string[];

    if (!seenVersions.includes(WHATS_NEW_VERSION)) {
      seenVersions.push(WHATS_NEW_VERSION);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seenVersions));
    }

    setHasSeenVersion(true);
    setIsModalOpen(false);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const hideModal = () => {
    setIsModalOpen(false);
  };

  return {
    isModalOpen,
    hasSeenVersion,
    showModal,
    hideModal,
    markAsSeen,
  };
}
