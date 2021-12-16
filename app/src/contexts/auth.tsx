import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import React, {
  FunctionComponent,
  useContext,
  useEffect,
  useState,
} from "react";

import { postUser } from "../api_client";

interface AuthContextValue {
  user: User | null;
  signup: (email: string, password: string, name: string) => void;
  login: (email: string, password: string) => void;
  logout: () => void;
  deleteCurrentUser: () => void;
}
const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  signup: () => {},
  login: () => {},
  logout: () => {},
  deleteCurrentUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider: FunctionComponent = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingUp, setSigningUp] = useState(false);

  async function signup(email: string, password: string, name: string) {
    setSigningUp(true);
    const auth = getAuth();
    await createUserWithEmailAndPassword(auth, email, password);
    try {
      const uid = auth.currentUser?.uid as string;
      const idToken = (await auth.currentUser?.getIdToken()) as string;
      await postUser(uid, idToken, { name });
      // Reload user to pick up any changes made by the above postUser call.
      await auth.currentUser?.reload();
    } catch (error) {
      auth.currentUser?.delete();
    }
    setSigningUp(false);
  }

  function login(email: string, password: string) {
    signInWithEmailAndPassword(getAuth(), email, password);
  }

  function logout() {
    signOut(getAuth());
  }

  function deleteCurrentUser() {
    if (user != null) {
      deleteUser(user);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (newUser) => {
      setUser(newUser);
      setLoading(false);
    });
    return unsubscribe;
  });

  const value: AuthContextValue = {
    user,
    signup,
    login,
    logout,
    deleteCurrentUser,
  };

  // TODO: This 'signingUp' approach works but makes the screen go blank
  // whenever you're signing up. Some method that allows for a loading
  // indicator would be better.
  return (
    <AuthContext.Provider value={value}>
      {!loading && !signingUp && children}
    </AuthContext.Provider>
  );
};
