import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { SHOW } from "../../store/constant";
import Loading from "../../components/Loading/Loading";
import ReturnItem from "./ReturnItem";
import "./ReturnPage.css";

function ReturnPage() {
    const [state] = useContext(AppContext);
    const [searchText, setSearchText] = useState('');

    const filteredItems = Object.values(state.items)
        .filter(item => item.borrower === state.username)
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
        <main className="return-page">
            <h1 className="return-page__title">To Return</h1>
            <label htmlFor="search-lender" className="return-page__search-label">
                <span className="return-page__search-title">Search lender:</span>
                <input
                    id="search-lender"
                    className="return-page__search"
                    type="text"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    placeholder="Lender name..."
                />
            </label>
            {show === SHOW.PENDING && <Loading>Loading items...</Loading>}
            {show === SHOW.EMPTY && (
                <p className="return-page__empty">You have no items to return.</p>
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
