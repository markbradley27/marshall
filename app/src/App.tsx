import "./App.scss";
import Activity from "./components/Activity";
import Login from "./components/Login";
import Logout from "./components/Logout";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./contexts/auth";

import { BrowserRouter, Route, Switch } from "react-router-dom";
import Container from "react-bootstrap/Container";

function App() {
  return (
    <AuthProvider>
      <Container>
        <Navbar />
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
      </Container>
    </AuthProvider>
  );
}

export default App;
