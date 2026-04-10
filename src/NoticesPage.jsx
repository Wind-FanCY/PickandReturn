import { useContext } from "react";
import { AppContext } from "./app-context";
import { SHOW } from "./constant";

import Loading from "./Loading";
import Item from "./Item";
import "./NoticesPage.css";

function NoticesPage() {
    const [state, dispatch] = useContext(AppContext);

    let show;
    if (state.isItemsPending) {
        show = SHOW.PENDING;
    } else if (!Object.values(state.items).filter(item => item.borrower === state.username).length) {
        show = SHOW.EMPTY;
    } else {
        show = SHOW.EXIST;
    }

    return (
        <div className="notices">
            <h1 className="notices__title">Return Notices</h1>
            {show === SHOW.PENDING && <Loading className="notices__waiting">Loading notices...</Loading>}
            {show === SHOW.EMPTY && (
                <p className="notices__empty">You have no reminders to return items.</p>
            )}
            {show === SHOW.EXIST && (
                <ul className="notices__list">
                    {Object.values(state.items).filter(item => item.borrower === state.username).map(item =>( 
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