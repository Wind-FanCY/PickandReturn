import { useContext } from "react";
import { AppContext } from "../../store/app-context";
import { t } from "../../store/i18n";
import "./Status.css";

function Status({ error, success }) {
    const [state] = useContext(AppContext);
    const lang = state.language;

    return (
        <>
            {error && <div className="status status--error">{t(lang, error)}</div>}
            {success && <div className="status status--success">{t(lang, success)}</div>}
        </>
    );
}

export default Status;
