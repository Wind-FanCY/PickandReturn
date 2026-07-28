import { useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../../store/app-context";
import { LOGIN_STATUS } from "../../store/constant";
import { t } from "../../store/i18n";
import "./PrivacyPage.css";

function PrivacyPage() {
    const [state] = useContext(AppContext);
    const lang = state.language;
    const backPath = state.loginStatus === LOGIN_STATUS.IS_LOGGED_IN ? '/items' : '/login';

    const sections = ['s1', 's2', 's3', 's4', 's5'];

    return (
        <main className="privacy">
            <h1 className="privacy__title">{t(lang, 'privacy.title')}</h1>
            <p className="privacy__updated">{t(lang, 'privacy.updated')}</p>
            <p className="privacy__intro">{t(lang, 'privacy.intro')}</p>
            {sections.map((s) => (
                <section className="privacy__section" key={s}>
                    <h2 className="privacy__section-title">{t(lang, `privacy.${s}Title`)}</h2>
                    <p className="privacy__section-body">{t(lang, `privacy.${s}Body`)}</p>
                </section>
            ))}
            <Link className="privacy__back" to={backPath}>{t(lang, 'privacy.back')}</Link>
        </main>
    );
}

export default PrivacyPage;
