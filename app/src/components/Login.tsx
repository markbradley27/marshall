import { useAuth } from "../contexts/auth";

import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const auth = useAuth();

  function handleSubmit(e: any) {
    e.preventDefault();
    auth.login(email, password);
  }

  if (auth.user != null) {
    return <h2>Signed in as {auth.user.displayName}.</h2>;
  } else {
    return (
      <form onSubmit={handleSubmit}>
        <label>
          <p>Email</p>
          <input
            type="text"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
        </label>
        <label>
          <p>Password</p>
          <input
            type="password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </label>
        <div>
          <button type="submit">Submit</button>
        </div>
      </form>
    );
  }
}

export default Login;
