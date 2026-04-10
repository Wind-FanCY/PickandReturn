import { useContext } from "react";
import { AppContext } from "../../store/app-context";
import { PAGE_STATUS } from "../../store/constant";

function Nav() {
    const [state, dispatch] = useContext(AppContext);

    function handleItemsPage() {
        dispatch({ type: 'checkItems' });
    }

    function handleNoticesPage() {
        dispatch({ type: 'checkNotices' });
    }

    return (
        <div className="nav">
            <ul className="nav__list">
                <li className="nav__item">
                    <button className={`nav__button${state.pageStatus === PAGE_STATUS.ITEMS_PAGE ? ' nav__button--active' : ''}`} onClick={handleItemsPage}>Items Lent</button>
                </li>
                <li className="nav__item">
                    <button className={`nav__button${state.pageStatus === PAGE_STATUS.NOTICES_PAGE ? ' nav__button--active' : ''}`} onClick={handleNoticesPage}>Items Due</button>
                </li>
            </ul>
        </div>
    );
}

export default Nav;
