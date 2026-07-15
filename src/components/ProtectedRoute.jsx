import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "../store/app-context";
import { LOGIN_STATUS } from "../store/constant";
import Loading from "./Loading/Loading";

function ProtectedRoute({ children }) {
    const [state] = useContext(AppContext);

    if (state.loginStatus === LOGIN_STATUS.PENDING) {
        return <Loading className="login__waiting">Loading user...</Loading>;
    }

    if (state.loginStatus === LOGIN_STATUS.NOT_LOGGED_IN) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
