import React from "react";

function AccordionButton({ title, children, onSave }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="accordion" id="accordionAdditionalInfo">
      <div className="accordion-item">
        <h2 className="accordion-header" id="headingAdditionalInfo">
          <button
            className="accordion-button"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseAdditionalInfo"
            aria-expanded="true"
            aria-controls="collapseAdditionalInfo"
          >
            {title}
          </button>
        </h2>
        <div
          id="collapseAdditionalInfo"
          className="accordion-collapse collapse"
          aria-labelledby="headingAdditionalInfo"
          data-bs-parent="#accordionAdditionalInfo"
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
