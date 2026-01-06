import { useEffect } from "react";
import { logout } from "../api/auth";

const LogoutHandler = () => {
  useEffect(() => {
    logout();
  }, []);

  return null;
};

export default LogoutHandler;
