import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import React, {
  FunctionComponent,
  useContext,
  useEffect,
  useState,
} from "react";

import { postUser } from "../api_shim";

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

  async function signup(email: string, password: string, name: string) {
    const auth = getAuth();
    await createUserWithEmailAndPassword(auth, email, password);
    auth.currentUser && updateProfile(auth.currentUser, { displayName: name });
    try {
      const uid = auth.currentUser?.uid as string;
      await postUser(uid, name);
    } catch (error) {
      auth.currentUser?.delete();
    }
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
    const unsubscribe = onAuthStateChanged(getAuth(), (newUser) => {
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

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
