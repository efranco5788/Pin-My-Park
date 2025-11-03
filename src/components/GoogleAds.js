import React, { useEffect } from "react";

const GoogleAd = () => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div style={{ textAlign: "center", margin: "20px 0"}}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="pub-2804657410672476" // Replace with your AdSense Publisher ID
        data-ad-slot="1234567890" // Replace with your Ad Slot ID
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default GoogleAd;
