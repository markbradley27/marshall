import "App.scss";
import Activity from "components/Activity";
import Dashboard from "components/Dashboard";
import Homepage from "components/Homepage";
import Login from "components/Login";
import MountainBrowser from "components/MountainBrowser";
import PageFrame from "components/PageFrame";
import SignUp from "components/SignUp";
import Mountain from "components/pages/Mountain";
import AddActivity from "components/pages/add_activity/AddActivity";
import AddAscent from "components/pages/add_ascent/AddAscent";
import AddList from "components/pages/add_list/AddList";
import Settings from "components/pages/settings/Settings";
import { useAuth } from "contexts/auth";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";

function App() {
  const auth = useAuth();

  return (
    <BrowserRouter>
      <PageFrame>
        <Switch>
          <Route exact path="/">
            {auth.users?.fb != null ? (
              <Redirect to="/dashboard" />
            ) : (
              <Homepage />
            )}
          </Route>
          <Route path="/login">
            {auth.users?.fb != null ? <Redirect to="/dashboard" /> : <Login />}
          </Route>
          <Route path="/signup">
            {auth.users?.fb != null ? <Redirect to="/dashboard" /> : <SignUp />}
          </Route>
          <Route path={["/dashboard", "/activities", "/ascents"]}>
            {auth.users?.fb != null ? <Dashboard /> : <Redirect to="/" />}
          </Route>
          <Route path="/settings">
            {auth.users?.fb == null ? <Redirect to="/login" /> : <Settings />}
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
          <Route path="/add_ascent">
            {auth.users?.fb == null ? <Redirect to="/login" /> : <AddAscent />}
          </Route>
          <Route path="/add_activity">
            {auth.users?.fb == null ? (
              <Redirect to="/login" />
            ) : (
              <AddActivity />
            )}
          </Route>
          <Route path="/add_list">
            {auth.users?.fb == null ? <Redirect to="/login" /> : <AddList />}
          </Route>
        </Switch>
      </PageFrame>
    </BrowserRouter>
  );
}

export default App;
