import React from "react";
import { Modal, Button } from "react-bootstrap";

const TermsOfServiceModal = ({ show, onClose }) => (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Body className="text-center text-light bg-dark p-4">
        <h2>Terms of Service</h2>
        <p>This app is provided as-is with no warranty.</p>
        <p>By using this app, you agree not to misuse or abuse the features.</p>
        <p>We are not responsible for lost vehicles, GPS errors, or data loss.</p>
        <div className="text-center mt-4">
          <Button variant="outline-light" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
  
export default TermsOfServiceModal;