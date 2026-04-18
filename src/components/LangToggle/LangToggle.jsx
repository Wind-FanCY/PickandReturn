import { useContext } from "react";
import { AppContext } from "../../store/app-context";
import { ACTIONS, LOGIN_STATUS } from "../../store/constant";
import { fetchUpdateLanguage } from "../../services/services";
import "./LangToggle.css";

function LangToggle() {
    const [state, dispatch] = useContext(AppContext);

    function handleToggle() {
        const newLang = state.language === 'zh' ? 'en' : 'zh';
        dispatch({ type: ACTIONS.TOGGLE_LANGUAGE });
        if (state.loginStatus === LOGIN_STATUS.IS_LOGGED_IN) {
            fetchUpdateLanguage(newLang).catch(() => { });
        }
    }

    return (
        <button
            className={`lang-toggle lang-toggle--${state.language}`}
            onClick={handleToggle}
            aria-label={state.language === 'zh' ? 'Switch to English' : '切换为中文'}
        >
            <span className="lang-toggle__zh">中</span>
            <span className="lang-toggle__divider">|</span>
            <span className="lang-toggle__en">EN</span>
        </button>
    );
}

export default LangToggle;
