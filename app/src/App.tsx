import "./App.css";
import Activity from "./components/Activity";
import Login from "./components/Login";
import Logout from "./components/Logout";
import { AuthProvider } from "./contexts/auth";

import { BrowserRouter, Route, Switch } from "react-router-dom";

function App() {
  return (
    <AuthProvider>
      <div>
        <h1>Marshall</h1>
        <BrowserRouter>
          <Switch>
            <Route path="/login">
              <Login />
            </Route>
            <Route path="/logout">
              <Logout />
            </Route>
            <Route path="/activity/:activityId">
              <Activity />
            </Route>
          </Switch>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
