import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { SHOW } from "../../store/constant";
import { t } from "../../store/i18n";
import Loading from "../../components/Loading/Loading";
import ReturnItem from "./ReturnItem";
import "./ReturnPage.css";

function ReturnPage() {
    const [state] = useContext(AppContext);
    const [searchText, setSearchText] = useState('');
    const [sortKey, setSortKey] = useState('lentDate');

    const lang = state.language;

    const filteredItems = Object.values(state.items)
        .filter(item => item.borrower === state.username)
        .filter(item => item.lender.toLowerCase().includes(searchText.toLowerCase()))
        .sort((a, b) => {
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
        <main className="return-page">
            <h1 className="return-page__title">{t(lang, 'returnPage.title')}</h1>
            <div className="return-page__controls">
                <div className="return-page__sort-search">
                    <div className="return-page__sort">
                        <span className="sort__label">{t(lang, 'returnPage.sortBy')}</span>
                        <button
                            className={`filter-btn${sortKey === 'lentDate' ? ' filter-btn--active' : ''}`}
                            onClick={() => setSortKey('lentDate')}
                        >{t(lang, 'returnPage.sortLentDate')}</button>
                        <button
                            className={`filter-btn${sortKey === 'backDate' ? ' filter-btn--active' : ''}`}
                            onClick={() => setSortKey('backDate')}
                        >{t(lang, 'returnPage.sortDueDate')}</button>
                    </div>
                    <label htmlFor="search-lender" className="return-page__search-label">
                        <span className="return-page__search-title">{t(lang, 'returnPage.searchLender')}</span>
                        <input
                            id="search-lender"
                            className="return-page__search"
                            type="text"
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            placeholder={t(lang, 'returnPage.searchPlaceholder')}
                        />
                    </label>
                </div>
            </div>
            {show === SHOW.PENDING && <Loading>Loading items...</Loading>}
            {show === SHOW.EMPTY && (
                <p className="return-page__empty">{t(lang, 'returnPage.empty')}</p>
            )}
            {show === SHOW.EXIST && (
                <ul className="return-page__list">
                    {filteredItems.map(item => (
                        <li className="return-page__item" key={item.id}>
                            <ReturnItem item={item} />
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}

export default ReturnPage;
