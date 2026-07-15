import { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../store/app-context";
import { LOGIN_STATUS } from "../../store/constant";
import { t } from "../../store/i18n";
import "./NotFoundPage.css";

function NotFoundPage() {
    const [state] = useContext(AppContext);
    const lang = state.language;
    const homePath = state.loginStatus === LOGIN_STATUS.IS_LOGGED_IN ? '/items' : '/login';

    return (
        <main className="not-found">
            <h1 className="not-found__title">404</h1>
            <p className="not-found__text">{t(lang, 'notFound.text')}</p>
            <Link className="not-found__link" to={homePath}>{t(lang, 'notFound.backHome')}</Link>
        </main>
    );
}

export default NotFoundPage;
