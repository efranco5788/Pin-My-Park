// PrivacyPolicyModal.js
import React from "react";
import { Modal, Button } from "react-bootstrap";

const PrivacyPolicyModal = ({ show, onClose }) => (
  <Modal show={show} onHide={onClose} centered>
    <Modal.Body className="text-center text-light bg-dark p-4">
      <h2>Privacy Policy</h2>
      <p>
        Your privacy is important to us. This app collects your location only
        when you choose to save your parking spot. This data is stored locally
        on your device and is not shared with third parties.
      </p>
      <p>
        We may use third-party services (like Google Maps and Google AdSense)
        that may collect anonymized usage data.
      </p>
      <p>By using this app, you agree to this policy.</p>
      <div className="text-center mt-4">
        <Button variant="outline-light" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal.Body>
  </Modal>
);

export default PrivacyPolicyModal;