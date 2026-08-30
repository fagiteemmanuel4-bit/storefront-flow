import { useEffect, useState } from "react";

const COOKIE_KEY = "strap-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(COOKIE_KEY) !== "accepted" && localStorage.getItem(COOKIE_KEY) !== "rejected");
  }, []);

  if (!visible) return null;

  const decide = (value: "accepted" | "rejected") => {
    localStorage.setItem(COOKIE_KEY, value);
    setVisible(false);
  };

  return (
    <aside className="strap-cookie" aria-label="Cookie preferences">
      <div>
        <strong>Cookies on Strap</strong>
        <p>We use essential cookies to keep Strap secure and working. Optional cookies help us understand product usage.</p>
      </div>
      <div className="strap-cookie-actions">
        <button type="button" onClick={() => decide("rejected")}>Reject</button>
        <button type="button" className="primary" onClick={() => decide("accepted")}>Accept</button>
      </div>
    </aside>
  );
}
