import React from "react";
import { Modal, Button } from "react-bootstrap";
import "../styles.css"; // if needed for general styles
import "../howItWorks.css"; // if needed for modal styles

const steps = [
  {
    icon: "🚗",
    title: "Save Your Spot",
    desc: 'Tap "Save My Parking Spot" and we’ll store your location via GPS.',
  },
  {
    icon: "📝",
    title: "Add Notes",
    desc: 'Write extra info like “Level B2” or “Near Elevator” to help you remember.',
  },
  {
    icon: "🕒",
    title: "Track Time",
    desc: "Keep an eye on how long you’ve been parked with a live timer.",
  },
  {
    icon: "🧭",
    title: "Navigate Back",
    desc: "Hit “Navigate” to open directions straight to your car.",
  },
];

const HowItWorksModal = ({ show, onClose }) => {
  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      dialogClassName="how-it-works-modal"
    >
      <Modal.Body className="text-center text-light bg-dark p-4">
        <h2 className="mb-4">How It Works</h2>

        <div className="row justify-content-center" style={{ marginBottom: "20px" }}>
          <Button
            variant="outline-light"
            className="mt-4"
            style={{ width: "50%", maxWidth: "200px" }}
            onClick={onClose}
          >
            Close
          </Button>
        </div>

        <div className="row justify-content-center">
          {steps.map((step, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-3 mb-4">
              <div className="p-3 shadow rounded bg-secondary text-white">
                <div style={{ fontSize: "36px" }}>{step.icon}</div>
                <h5 className="mt-2">{step.title}</h5>
                <p className="small">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default HowItWorksModal;