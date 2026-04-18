import { useContext } from "react";
import { AppContext } from "../../store/app-context";
import { ACTIONS } from "../../store/constant";
import "./LangToggle.css";

function LangToggle() {
    const [state, dispatch] = useContext(AppContext);

    function handleToggle() {
        dispatch({ type: ACTIONS.TOGGLE_LANGUAGE });
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
