import { useAuth } from "../contexts/auth";

export default function Dashboard() {
  const auth = useAuth();

  return <h3> Welcome {auth.user?.displayName}</h3>;
}
