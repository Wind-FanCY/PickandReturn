import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { SHOW, RETURN_STATUS } from "../../store/constant";
import { t } from "../../store/i18n";

import Loading from "../../components/Loading/Loading";
import Item from "../../components/Item/Item";
import AddItemForm from "./AddItemForm";
import "./ItemsPage.css";

function ItemsPage() {
    const [state] = useContext(AppContext);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchText, setSearchText] = useState('');
    const [sortKey, setSortKey] = useState('createdAt');

    const lang = state.language;

    const lentItems = Object.values(state.items)
        .filter(item => item.lender.username === state.username)
        .filter(item => item.borrower.username.toLowerCase().includes(searchText.toLowerCase()))
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

    const historyItems = lentItems.filter(item => item.returnStatus === RETURN_STATUS.CONFIRMED);

    const activeItems = lentItems
        .filter(item => item.returnStatus !== RETURN_STATUS.CONFIRMED)
        .filter(item => {
            if (filterStatus === 'requested') return item.returnStatus === RETURN_STATUS.REQUESTED;
            if (filterStatus === 'pending') return item.returnStatus === RETURN_STATUS.PENDING;
            return true;
        });

    let show;
    if (state.isItemsPending) {
        show = SHOW.PENDING;
    } else if (!activeItems.length) {
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
                            className={`filter-btn${filterStatus === 'pending' ? ' filter-btn--active' : ''}`}
                            onClick={() => setFilterStatus('pending')}
                        >{t(lang, 'items.filterNotReturned')}</button>
                        <button
                            className={`filter-btn${filterStatus === 'requested' ? ' filter-btn--active' : ''}`}
                            onClick={() => setFilterStatus('requested')}
                        >{t(lang, 'items.filterRequested')}</button>
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
                    {activeItems.map(item => (
                        <li
                            className={`item${item.id === state.lastAddedItemId ? ' item--new' : ''}`}
                            key={item.id}
                        >
                            <Item item={item} />
                        </li>
                    ))}
                </ul>
            )}
            {historyItems.length > 0 && (
                <details className="items__history">
                    <summary className="items__history-summary">
                        {t(lang, 'items.history')} ({historyItems.length})
                    </summary>
                    <ul className="items__history-list">
                        {historyItems.map(item => (
                            <li className="item" key={item.id}>
                                <Item item={item} />
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}

export default ItemsPage;
