import { useContext } from "react";
import { AppContext } from "../../store/app-context";
import { PAGE_STATUS, ACTIONS } from "../../store/constant";
import { t } from "../../store/i18n";
import NotificationBell from "../../features/notifications/NotificationBell";
import LangToggle from "../LangToggle/LangToggle";

function Nav() {
    const [state, dispatch] = useContext(AppContext);

    function handleItemsPage() {
        dispatch({ type: ACTIONS.CHECK_ITEMS });
    }

    function handleReturnPage() {
        dispatch({ type: ACTIONS.CHECK_RETURN });
    }

    const lang = state.language;

    return (
        <nav className="nav">
            <ul className="nav__list">
                <li className="nav__item">
                    <button
                        className={`nav__button${state.pageStatus === PAGE_STATUS.ITEMS_PAGE ? ' nav__button--active' : ''}`}
                        onClick={handleItemsPage}
                    >
                        {t(lang, 'nav.itemsLent')}
                    </button>
                </li>
                <li className="nav__item">
                    <button
                        className={`nav__button${state.pageStatus === PAGE_STATUS.RETURN_PAGE ? ' nav__button--active' : ''}`}
                        onClick={handleReturnPage}
                    >
                        {t(lang, 'nav.toReturn')}
                    </button>
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
