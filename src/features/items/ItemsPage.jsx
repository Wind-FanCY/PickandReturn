import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { SHOW } from "../../store/constant";

import Loading from "../../components/Loading/Loading";
import Item from "../../components/Item/Item";
import AddItemForm from "./AddItemForm";
import "./ItemsPage.css";

function ItemsPage() {
    const [state, dispatch] = useContext(AppContext);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchText, setSearchText] = useState('');

    const filteredItems = Object.values(state.items)
        .filter(item => item.lender === state.username)
        .filter(item => {
            if (filterStatus === 'returned') return item.returned;
            if (filterStatus === 'not-returned') return !item.returned;
            return true;
        })
        .filter(item => item.borrower.toLowerCase().includes(searchText.toLowerCase()));

    let show;
    if (state.isItemsPending) {
        show = SHOW.PENDING;
    } else if (!filteredItems.length) {
        show = SHOW.EMPTY;
    } else {
        show = SHOW.EXIST;
    }

    return (
        <div className="items">
            <h1 className="items__title">Lent Log</h1>
            <AddItemForm />
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
                <label htmlFor="search-borrower" className="items__search-label">
                    <span className="search__title">Search borrower:</span>
                    <input
                        id="search-borrower"
                        className="items__search"
                        type="text"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        placeholder="Borrower name..."
                    />
                </label>
            </div>
            {show === SHOW.PENDING && <Loading className="items__waiting">Loading items...</Loading>}
            {show === SHOW.EMPTY && (
                <p className="items__empty">Create your first lending reminder!</p>
            )}
            {show === SHOW.EXIST && (
                <ul className="items__list">
                    {filteredItems.map(item => (
                        <li
                            className={`item${item.id === state.lastAddedItemId ? ' item--new' : ''}`}
                            key={item.id}
                        >
                            <Item item={item} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ItemsPage;
