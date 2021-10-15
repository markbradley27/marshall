import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";

import "./App.scss";
import Activity from "./components/Activity";
import Dashboard from "./components/Dashboard";
import Homepage from "./components/Homepage";
import Login from "./components/Login";
import Mountain from "./components/Mountain";
import MountainBrowser from "./components/MountainBrowser";
import Navbar from "./components/Navbar";
import Settings from "./components/Settings";
import SignUp from "./components/SignUp";
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
        <Route path="/login">
          {auth.user != null ? <Redirect to="/dashboard" /> : <Login />}
        </Route>
        <Route path="/signup">
          {auth.user != null ? <Redirect to="/dashboard" /> : <SignUp />}
        </Route>
        <Route path={["/dashboard", "/activities", "/ascents"]}>
          {auth.user != null ? <Dashboard /> : <Redirect to="/" />}
        </Route>
        <Route path="/settings">
          {auth.user == null ? <Redirect to="login" /> : <Settings />}
        </Route>
        <Route path="/activity/:activityId">
          <Activity />
        </Route>
        <Route path="/mountain/:mountainId">
          <Mountain />
        </Route>
        <Route path="/mountains">
          <MountainBrowser />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
