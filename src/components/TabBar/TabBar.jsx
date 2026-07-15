import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AppContext } from "../../store/app-context";
import { t } from "../../store/i18n";
import "./TabBar.css";

function tabLinkClass({ isActive }) {
    return `tab-bar__link${isActive ? ' tab-bar__link--active' : ''}`;
}

// Mobile-only bottom navigation. Mirrors the desktop top Nav's page links
// (Nav.jsx) so users always have one way to switch pages, never both at once.
function TabBar() {
    const [state] = useContext(AppContext);
    const lang = state.language;

    return (
        <nav className="tab-bar" aria-label={t(lang, 'nav.tabBarLabel')}>
            <NavLink className={tabLinkClass} to="/items">
                <span className="tab-bar__icon" aria-hidden="true">📤</span>
                <span className="tab-bar__label">{t(lang, 'nav.itemsLent')}</span>
            </NavLink>
            <NavLink className={tabLinkClass} to="/return">
                <span className="tab-bar__icon" aria-hidden="true">📥</span>
                <span className="tab-bar__label">{t(lang, 'nav.toReturn')}</span>
            </NavLink>
            <NavLink className={tabLinkClass} to="/notifications">
                <span className="tab-bar__icon" aria-hidden="true">🔔</span>
                <span className="tab-bar__label">{t(lang, 'nav.notifications')}</span>
            </NavLink>
        </nav>
    );
}

export default TabBar;
