import { Children, useContext } from "react";
import { AppContext } from "./app-context";
import { SHOW } from "./constant";

import Loading from "./Loading";
import Item from "./Item";
import AddItemForm from "./AddItemForm";
import "./ItemsPage.css";

function ItemsPage() {
    const [state, dispatch] = useContext(AppContext);

    let show;
    if (state.isItemsPending) {
        show = SHOW.PENDING;
    } else if (!Object.values(state.items).filter(item => item.lender === state.username).length) {
        show = SHOW.EMPTY;
    } else {
        show = SHOW.EXIST;
    }

    return (
        <div className="items">
            <h1 className="items__title">Lent Log</h1>
            <AddItemForm />
            {show === SHOW.PENDING && <Loading className="items__waiting">Loading items...</Loading>}
            {show === SHOW.EMPTY && (
                <p className="items__empty">Create your first lending reminder!</p>
            )}
            {show === SHOW.EXIST && (
                <ul className="items__list">
                    {Object.values(state.items).filter(item => item.lender === state.username).map(item => (
                        <li className="item" key={item.id}>
                            <Item item={item} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ItemsPage;