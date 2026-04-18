import { useContext } from "react";
import { fetchLogout } from "../../services/services";
import { AppContext } from "../../store/app-context";
import { t } from "../../store/i18n";

import logoutIcon from "../../assets/logout_icon.png";

function Controls() {
    const [state, dispatch] = useContext(AppContext);

    function onLogout() {
        fetchLogout()
            .then(() => {
                dispatch({ type: 'logOut' });
            })
            .catch(err => {
                dispatch({ type: 'reportError', error: err?.error });
            });
    }

    const lang = state.language;

    return (
        <div className="controls">
            <span className="controls__username">{state.username}</span>
            <button onClick={onLogout} className="controls__logout"><img className="icon" src={logoutIcon} alt="logout button" />{t(lang, 'controls.logout')}</button>
        </div>
    );
}

export default Controls;
