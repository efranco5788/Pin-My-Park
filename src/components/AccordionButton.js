// src/components/AccordionButton.jsx
import React, { useState, useRef } from "react";

/**
 * AccordionButton
 * Props:
 * - title: string
 * - children: node (form fields)
 * - onSave: fn called on form submit
 * - defaultOpen: boolean (open by default)
 */
function AccordionButton({ title, children, onSave, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(Boolean(defaultOpen));
  // unique id per instance so multiple accordions don't conflict
  const idRef = useRef(`accordion-${Math.random().toString(36).slice(2, 9)}`);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onSave === "function") onSave();
  };

  const buttonClass = `accordion-button${isOpen ? "" : " collapsed"}`;
  const collapseClass = `accordion-collapse collapse${isOpen ? " show" : ""}`;
  const ariaExpanded = isOpen ? "true" : "false";

  return (
    <div className="accordion" id={`${idRef.current}-parent`}>
      <div className="accordion-item">
        <h2 className="accordion-header" id={`${idRef.current}-heading`}>
          <button
            className={buttonClass}
            type="button"
            aria-expanded={ariaExpanded}
            aria-controls={`${idRef.current}-collapse`}
            onClick={() => setIsOpen((s) => !s)}
            style={{ cursor: "pointer" }}
          >
            {title}
          </button>
        </h2>

        <div
          id={`${idRef.current}-collapse`}
          className={collapseClass}
          aria-labelledby={`${idRef.current}-heading`}
          data-bs-parent={`#${idRef.current}-parent`}
        >
          <div className="accordion-body">
            <form onSubmit={handleSubmit}>
              {children}
              <button type="submit" className="btn btn-primary mt-3">
                Save
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccordionButton;