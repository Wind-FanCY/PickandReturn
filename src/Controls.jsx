import { useContext } from "react";
import { fetchLogout } from "./services";
import { AppContext } from "./app-context";

import logoutIcon from "./assets/logout_icon.png";

function Controls() {
    const [state, dispatch] = useContext(AppContext);

    function onLogout() {
        dispatch({ type: 'logOut' });
        fetchLogout()
            .catch(err => {
                dispatch({ type: 'reportError', error: err?.error });
            });
    }

    return (
        <div className="controls">
            <span className="controls__username">{state.username}</span>
            <button onClick={onLogout} className="controls__logout"><img className="icon" src={logoutIcon} alt="logout button" />Logout</button>
        </div>
    );
}

export default Controls;