import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { SHOW } from "../../store/constant";

import Loading from "../../components/Loading/Loading";
import Item from "../../components/Item/Item";
import "./NoticesPage.css";

function NoticesPage() {
    const [state, dispatch] = useContext(AppContext);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchText, setSearchText] = useState('');

    const filteredItems = Object.values(state.items)
        .filter(item => item.borrower === state.username)
        .filter(item => {
            if (filterStatus === 'returned') return item.returned;
            if (filterStatus === 'not-returned') return !item.returned;
            return true;
        })
        .filter(item => item.lender.toLowerCase().includes(searchText.toLowerCase()));

    let show;
    if (state.isItemsPending) {
        show = SHOW.PENDING;
    } else if (!filteredItems.length) {
        show = SHOW.EMPTY;
    } else {
        show = SHOW.EXIST;
    }

    return (
        <div className="notices">
            <h1 className="notices__title">Return Notices</h1>
            <div className="items__filters">
                <div className="items__filter-buttons">
                    <button
                        className={`filter-btn${filterStatus === 'all' ? ' filter-btn--active' : ''}`}
                        onClick={() => setFilterStatus('all')}
                    >All</button>
                    <button
                        className={`filter-btn${filterStatus === 'not-returned' ? ' filter-btn--active' : ''}`}
                        onClick={() => setFilterStatus('not-returned')}
                    >Not Returned</button>
                    <button
                        className={`filter-btn${filterStatus === 'returned' ? ' filter-btn--active' : ''}`}
                        onClick={() => setFilterStatus('returned')}
                    >Returned</button>
                </div>
                <label htmlFor="search-lender" className="items__search-label">
                    <span className="search__title">Search lender:</span>
                    <input
                        id="search-lender"
                        className="items__search"
                        type="text"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        placeholder="Lender name..."
                    />
                </label>
            </div>
            {show === SHOW.PENDING && <Loading className="notices__waiting">Loading notices...</Loading>}
            {show === SHOW.EMPTY && (
                <p className="notices__empty">You have no reminders to return items.</p>
            )}
            {show === SHOW.EXIST && (
                <ul className="notices__list">
                    {filteredItems.map(item => (
                        <li className="notice" key={item.id}>
                            <Item item={item} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default NoticesPage;
