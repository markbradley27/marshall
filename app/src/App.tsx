import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";

import "./App.scss";
import Activity from "./components/Activity";
import Dashboard from "./components/Dashboard";
import Homepage from "./components/Homepage";
import Login from "./components/Login";
import Mountain from "./components/Mountain";
import Navbar from "./components/Navbar";
import SignUp from "./components/SignUp";
import Settings from "./components/Settings";
import { useAuth } from "./contexts/auth";

function App() {
  const auth = useAuth();

  return (
    <BrowserRouter>
      <Navbar />
      <Switch>
        <Route exact path="/">
          {auth.user != null ? <Redirect to="/dashboard" /> : <Homepage />}
        </Route>
        <Route exact path="/login">
          {auth.user != null ? <Redirect to="/dashboard" /> : <Login />}
        </Route>
        <Route exact path="/signup">
          {auth.user != null ? <Redirect to="/dashboard" /> : <SignUp />}
        </Route>
        <Route exact path={["/dashboard", "/activities", "/ascents"]}>
          {auth.user != null ? <Dashboard /> : <Redirect to="/" />}
        </Route>
        <Route exact path="/settings">
          {auth.user == null ? <Redirect to="login" /> : <Settings />}
        </Route>
        <Route exact path="/activity/:activityId">
          <Activity />
        </Route>
        <Route exact path="/mountain/:mountainId">
          <Mountain />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
