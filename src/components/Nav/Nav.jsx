import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AppContext } from "../../store/app-context";
import { t } from "../../store/i18n";
import NotificationBell from "../../features/notifications/NotificationBell";
import LangToggle from "../LangToggle/LangToggle";

function navLinkClass({ isActive }) {
    return `nav__button${isActive ? ' nav__button--active' : ''}`;
}

function Nav() {
    const [state] = useContext(AppContext);
    const lang = state.language;

    return (
        <nav className="nav">
            <ul className="nav__list">
                <li className="nav__item">
                    <NavLink className={navLinkClass} to="/items">
                        {t(lang, 'nav.itemsLent')}
                    </NavLink>
                </li>
                <li className="nav__item">
                    <NavLink className={navLinkClass} to="/return">
                        {t(lang, 'nav.toReturn')}
                    </NavLink>
                </li>
                <li className="nav__item">
                    <NavLink className={navLinkClass} to="/notifications">
                        {t(lang, 'nav.notifications')}
                    </NavLink>
                </li>
            </ul>
            <div className="nav__right">
                <NotificationBell />
                <LangToggle />
            </div>
        </nav>
    );
}

export default Nav;
