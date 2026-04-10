import { useContext } from "react";
import { AppContext } from "./app-context";

function Nav() {
    const [state, dispatch] = useContext(AppContext);

    function handleItemsPage(e) {
        e.preventDefault();
        dispatch({ type: 'checkItems' });
    }

    function handleNoticesPage(e) {
        e.preventDefault();
        dispatch({ type: 'checkNotices' });
    }

    return (
        <div className="nav">
            <ul className="nav__list">
                <li className="nav__item">
                    <a className="nav__link" href="/lent" onClick={handleItemsPage}>Items Lent</a>
                </li>
                <li className="nav__item">
                    <a className="nav__link" href="/borrowed" onClick={handleNoticesPage}>Items Due</a>
                </li>
            </ul>
        </div>
    );
}

export default Nav;