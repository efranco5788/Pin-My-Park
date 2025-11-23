// src/hooks/useModals.js
import { useState, useCallback } from "react";

/**
 * useModals - centralized modal management
 * activeModal: null | "how" | "privacy" | "terms" | "error"
 * errorMessage stored separately
 */
export default function useModals() {
  const [activeModal, setActiveModal] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const showModal = useCallback((name) => {
    setActiveModal(name);
  }, []);

  const hideModal = useCallback(() => {
    setActiveModal(null);
    setErrorMessage(null);
  }, []);

  const showError = useCallback((message) => {
    setErrorMessage(message);
    setActiveModal("error");
  }, []);

  return {
    activeModal,
    errorMessage,
    showModal,
    hideModal,
    showError,
  };
}
