import { fetchUser, postUser, UserState } from "api/user_endpoints";
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

interface AuthUsers {
  fb: User | null;
  db: UserState | null;
}

interface AuthContextValue {
  users: AuthUsers | null;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateDbUser: (options: any) => Promise<void>;
  refreshDbUser: () => Promise<void>;
  deleteCurrentUser: () => void;
}
const AuthContext = React.createContext<AuthContextValue>({
  users: null,
  signup: async () => {},
  login: async () => {},
  logout: () => {},
  updateDbUser: async () => {},
  refreshDbUser: async () => {},
  deleteCurrentUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider: FunctionComponent = ({ children }) => {
  // Users object is null before firebase auth has loaded.
  // Will be an AuthUsers object with null members if nobody is logged in.
  // Otherwise, both members will always be set.
  const [users, setUsers] = useState<AuthUsers | null>(null);
  const [updatesDisabled, setUpdatesDisabled] = useState(false);

  async function signup(email: string, password: string, name: string) {
    // Disable updates until the signup flow is complete to avoid races.
    const auth = getAuth();

    await createUserWithEmailAndPassword(auth, email, password);
    try {
      const uid = auth.currentUser?.uid as string;
      const idToken = (await auth.currentUser?.getIdToken()) as string;
      await postUser(uid, idToken, { name });

      // Reload user to pick up any changes made by the above postUser call.
      await auth.currentUser?.reload();
      await refreshDbUser();
    } catch (error) {
      auth.currentUser?.delete();
      throw error;
    } finally {
      setUpdatesDisabled(false);
    }
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(getAuth(), email, password);
  }

  function logout() {
    signOut(getAuth());
  }

  async function updateDbUser(options: any) {
    // TODO: Throw an error or something.
    if (users?.fb == null) {
      return;
    }
    await postUser(users.fb.uid, await users.fb.getIdToken(), options);
    const dbUser = await fetchUser(users.fb.uid, {
      idToken: await users.fb.getIdToken(),
    });
    setUsers((users) => {
      return {
        fb: users?.fb,
        db: dbUser,
      } as AuthUsers;
    });
  }

  async function refreshDbUser() {
    if (users?.fb != null) {
      const dbUser = await fetchUser(users?.fb?.uid as string, {
        idToken: await users?.fb?.getIdToken(),
      });
      setUsers({
        fb: users.fb,
        db: dbUser,
      });
    }
  }

  function deleteCurrentUser() {
    if (users?.fb != null) {
      deleteUser(users?.fb);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (newFbUser) => {
      if (updatesDisabled) {
        return;
      }

      // This gets called even when it appears the user has not changed. The
      // hack is to ignore the calls when they're not actually changes.
      if (users != null && newFbUser?.uid === users?.fb?.uid) {
        return;
      }

      let dbUser = null;
      if (newFbUser != null) {
        dbUser = await fetchUser(newFbUser.uid, {
          idToken: await newFbUser.getIdToken(),
        });
      }
      setUsers({
        fb: newFbUser,
        db: dbUser,
      });
      return;
    });
    return unsubscribe;
  });

  const value: AuthContextValue = {
    users,
    signup,
    login,
    logout,
    updateDbUser,
    refreshDbUser,
    deleteCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {users && children}
    </AuthContext.Provider>
  );
};
