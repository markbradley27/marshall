import "App.scss";
import Dashboard from "components/Dashboard";
import Login from "components/Login";
import MountainBrowser from "components/MountainBrowser";
import SignUp from "components/SignUp";
import Activity from "components/pages/Activity";
import LandingPage from "components/pages/LandingPage";
import List from "components/pages/List";
import Mountain from "components/pages/Mountain";
import TODO from "components/pages/TODO";
import AddActivity from "components/pages/add_activity/AddActivity";
import AddAscent from "components/pages/add_ascent/AddAscent";
import AddList from "components/pages/add_list/AddList";
import Settings from "components/pages/settings/Settings";
import PageFrame from "components/shared/page_framework/PageFrame";
import UnAuthedPageFrame from "components/shared/page_framework/UnAuthedPageFrame";
import { useAuth } from "contexts/auth";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";

function App() {
  const auth = useAuth();

  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/">
          {auth.users?.fb != null ? (
            <Redirect to="/dashboard" />
          ) : (
            <UnAuthedPageFrame>
              <LandingPage />
            </UnAuthedPageFrame>
          )}
        </Route>
        <Route path="/login">
          {auth.users?.fb != null ? (
            <Redirect to="/dashboard" />
          ) : (
            <UnAuthedPageFrame>
              <Login />
            </UnAuthedPageFrame>
          )}
        </Route>
        <Route path="/signup">
          {auth.users?.fb != null ? (
            <Redirect to="/dashboard" />
          ) : (
            <UnAuthedPageFrame>
              <SignUp />
            </UnAuthedPageFrame>
          )}
        </Route>
        <Route path={["/dashboard", "/activities", "/ascents"]}>
          {auth.users?.fb == null ? (
            <Redirect to="/" />
          ) : (
            <PageFrame>
              <Dashboard />
            </PageFrame>
          )}
        </Route>
        <Route path="/settings">
          {auth.users?.fb == null ? (
            <Redirect to="/login" />
          ) : (
            <PageFrame>
              <Settings />
            </PageFrame>
          )}
        </Route>
        <Route path="/activity/:activityId">
          <PageFrame>
            <Activity />
          </PageFrame>
        </Route>
        <Route path="/list/:listId">
          <PageFrame>
            <List />
          </PageFrame>
        </Route>
        <Route path="/mountain/:mountainId">
          <PageFrame>
            <Mountain />
          </PageFrame>
        </Route>
        <Route path="/mountains">
          <PageFrame>
            <MountainBrowser />
          </PageFrame>
        </Route>
        <Route path="/add_ascent">
          {auth.users?.fb == null ? (
            <Redirect to="/login" />
          ) : (
            <PageFrame>
              <AddAscent />
            </PageFrame>
          )}
        </Route>
        <Route path="/add_activity">
          {auth.users?.fb == null ? (
            <Redirect to="/login" />
          ) : (
            <PageFrame>
              <AddActivity />
            </PageFrame>
          )}
        </Route>
        <Route path="/add_list">
          {auth.users?.fb == null ? (
            <Redirect to="/login" />
          ) : (
            <PageFrame>
              <AddList />
            </PageFrame>
          )}
        </Route>
        <Route path="/TODO">
          <UnAuthedPageFrame>
            <TODO />
          </UnAuthedPageFrame>
        </Route>
      </Switch>
    </BrowserRouter>
  );
}

export default App;
