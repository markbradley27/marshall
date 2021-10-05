import { useAuth } from "../contexts/auth";

import { useEffect } from "react";

function Logout() {
  const auth = useAuth();

  useEffect(() => {
    if (auth.user != null) {
      auth.logout();
    }
  });

  if (auth.user != null) {
    return <h2>Logging out...</h2>;
  } else {
    return <h2>Logged out.</h2>;
  }
}

export default Logout;
