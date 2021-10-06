import { useEffect } from "react";

import { useAuth } from "../contexts/auth";

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
