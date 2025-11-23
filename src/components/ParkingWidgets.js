import React, { Suspense } from "react";
import Loader from "./SharedLoader"; // You can replace this with your existing loader

const Map = React.lazy(() => import("./Maps"));
const ParkingLocation = React.lazy(() => import("./ParkingLocation"));
const NavigationButton = React.lazy(() => import("./NavigationButton"));

/**
 * ParkingWidgets
 * Cleans up ParkingLocationPage by holding all map + parking UI widgets.
 *
 * Props:
 *  - location
 *  - address
 *  - timestamp
 *  - isParkingSaved
 */
export default function ParkingWidgets({
  location,
  address,
  timestamp,
  isParkingSaved,
}) {
  const displayedLocation =
    location || { latitude: 40.7128, longitude: -74.0060 };

  return (
    <Suspense fallback={<Loader text="Loading map and parking details…" />}>
      {/* Map */}
      <section className="mt-5">
        <Map location={displayedLocation} />
      </section>

      {/* Only show parking details + navigation if saved */}
      {isParkingSaved && (
        <>
          <section className="mt-4">
            <NavigationButton location={location} />
          </section>

          <section className="mt-4">
            <ParkingLocation
              location={location}
              address={address}
              timestamp={timestamp}
            />
          </section>
        </>
      )}
    </Suspense>
  );
}
