import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { SHOW } from "../../store/constant";
import { t } from "../../store/i18n";

import Loading from "../../components/Loading/Loading";
import Item from "../../components/Item/Item";
import AddItemForm from "./AddItemForm";
import "./ItemsPage.css";

function ItemsPage() {
    const [state, dispatch] = useContext(AppContext);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [sortKey, setSortKey] = useState('createdAt');

    const lang = state.language;

    const filteredItems = Object.values(state.items)
        .filter(item => item.lender === state.username)
        .filter(item => {
            if (filterStatus === 'returned') return item.returned;
            if (filterStatus === 'not-returned') return !item.returned;
            return true;
        })
        .filter(item => item.borrower.toLowerCase().includes(searchText.toLowerCase()))
        .sort((a, b) => {
            if (sortKey === 'createdAt') {
                return (b.createdAt || '').localeCompare(a.createdAt || '');
            }
            if (sortKey === 'lentDate') {
                return (a.lentDate || '').localeCompare(b.lentDate || '');
            }
            if (sortKey === 'backDate') {
                return (a.backDate || '').localeCompare(b.backDate || '');
            }
            return 0;
        });

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
            <h1 className="items__title">{t(lang, 'items.title')}</h1>
            <AddItemForm />
            <div className="items__filters">
                <div className="items__controls-row">
                    <div className="items__filter-buttons">
                        <button
                            className={`filter-btn${filterStatus === 'all' ? ' filter-btn--active' : ''}`}
                            onClick={() => setFilterStatus('all')}
                        >{t(lang, 'items.filterAll')}</button>
                        <button
                            className={`filter-btn${filterStatus === 'not-returned' ? ' filter-btn--active' : ''}`}
                            onClick={() => setFilterStatus('not-returned')}
                        >{t(lang, 'items.filterNotReturned')}</button>
                        <button
                            className={`filter-btn${filterStatus === 'returned' ? ' filter-btn--active' : ''}`}
                            onClick={() => setFilterStatus('returned')}
                        >{t(lang, 'items.filterReturned')}</button>
                    </div>
                    <div className="items__sort-search">
                        <div className="items__sort">
                            <span className="sort__label">{t(lang, 'items.sortBy')}</span>
                            <button
                                className={`filter-btn${sortKey === 'createdAt' ? ' filter-btn--active' : ''}`}
                                onClick={() => setSortKey('createdAt')}
                            >{t(lang, 'items.sortAdded')}</button>
                            <button
                                className={`filter-btn${sortKey === 'lentDate' ? ' filter-btn--active' : ''}`}
                                onClick={() => setSortKey('lentDate')}
                            >{t(lang, 'items.sortLentDate')}</button>
                            <button
                                className={`filter-btn${sortKey === 'backDate' ? ' filter-btn--active' : ''}`}
                                onClick={() => setSortKey('backDate')}
                            >{t(lang, 'items.sortDueDate')}</button>
                        </div>
                        <label htmlFor="search-borrower" className="items__search-label">
                            <span className="search__title">{t(lang, 'items.searchBorrower')}</span>
                            <input
                                id="search-borrower"
                                className="items__search"
                                type="text"
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                placeholder={t(lang, 'items.searchPlaceholder')}
                            />
                        </label>
                    </div>
                </div>
            </div>
            {show === SHOW.PENDING && <Loading className="items__waiting">Loading items...</Loading>}
            {show === SHOW.EMPTY && (
                <p className="items__empty">{t(lang, 'items.empty')}</p>
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
