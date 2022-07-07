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

import { fetchUser, postUser, UserState } from "../api_client";

interface AuthContextValue {
  fbUser: User | null;
  dbUser: UserState | null;
  signup: (email: string, password: string, name: string) => void;
  login: (email: string, password: string) => void;
  logout: () => void;
  updateUser: (options: any) => Promise<void>;
  refreshDbUser: () => Promise<void>;
  deleteCurrentUser: () => void;
}
const AuthContext = React.createContext<AuthContextValue>({
  fbUser: null,
  dbUser: null,
  signup: () => {},
  login: () => {},
  logout: () => {},
  updateUser: async () => {},
  refreshDbUser: async () => {},
  deleteCurrentUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider: FunctionComponent = ({ children }) => {
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<UserState | null>(null);
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

  async function updateUser(options: any) {
    // TODO: Throw an error or something.
    if (fbUser == null) {
      return;
    }
    await postUser(fbUser.uid, await fbUser.getIdToken(), options);
    setDbUser(
      await fetchUser(fbUser.uid, { idToken: await fbUser.getIdToken() })
    );
  }

  async function refreshDbUser() {
    if (fbUser != null) {
      setDbUser(
        await fetchUser(fbUser.uid, { idToken: await fbUser.getIdToken() })
      );
    }
  }

  function deleteCurrentUser() {
    if (fbUser != null) {
      deleteUser(fbUser);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (newFbUser) => {
      // This gets called even when it appears the user has not changed. The
      // hack is to ignore the calls when they're not actually changes.
      if (newFbUser?.uid === fbUser?.uid) {
        setLoading(false);
        return;
      }

      setFbUser(newFbUser);
      if (newFbUser == null) {
        setDbUser(null);
      } else {
        setDbUser(
          await fetchUser(newFbUser.uid, {
            idToken: await newFbUser.getIdToken(),
          })
        );
      }
      setLoading(false);
    });
    return unsubscribe;
  });

  const value: AuthContextValue = {
    fbUser,
    dbUser,
    signup,
    login,
    logout,
    updateUser,
    refreshDbUser,
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
