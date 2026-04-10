import { useContext } from "react";
import { AppContext } from "./app-context";
import {
    fetchDeleteItem,
    fetchUpdateItem,
    fetchSendNotice
} from "./services";

import reminderIcon from "./assets/reminder_icon.png";
import deleteIcon from "./assets/delete_icon.png";
import "./Item.css";

function Item({ item }) {
    const [state, dispatch] = useContext(AppContext);
    const isReturnedClass = item.returned ? "item__text--returned" : "";

    function onDeleteItem(id) {
        dispatch({ type: 'startLoadingItems' });
        fetchDeleteItem(id)
          .then(() => {
            dispatch({ type: 'deleteItem', id: id })
          })
          .catch(err => {
            dispatch({ type: 'reportError', error: err?.error });
          });
    }
    
      function onToggleLendStatus(id) {
        fetchUpdateItem(id, !state.items[id].returned)
          .then(item => {
            dispatch({ type: 'returnItem', item: item });
          })
          .catch(err => {
            dispatch({ type: 'reportError', error: err?.error });
          });
    }
    
      function onSendNotice(id) {
          fetchSendNotice(id)
              .then(item => {
                dispatch({ type: 'sendNotice', item: item });
            })
            .catch(err => {
            dispatch({ type: 'reportError', error: err?.error });
          })
    }

    return (
        item.lender === state.username ? (
            <>
                <label className="item__label">
                    <input
                        className="item__toggle"
                        data-id={item.id}
                        type="checkbox"
                        checked={!!item.returned}
                        onChange={(e) => {
                            const id = e.target.dataset.id;
                            onToggleLendStatus(id);
                        }}
                    />
                    <span className="toggle__title">Returned</span>
                </label>
                <span
                    data-id={item.id}
                    className={`item__borrower ${isReturnedClass}`}
                >
                    Borrower: {item.borrower}
                </span>
                <span
                    data-id={item.id}
                    className={`item__lentDate ${isReturnedClass}`}
                >
                    Lent Date: {item.lentDate}
                </span>
                <span
                    data-id={item.id}
                    className={`item__backDate ${isReturnedClass}`}
                >
                    Due Date: {item.backDate}
                </span>
                <span
                    data-id={item.id}
                    className={`item__text ${isReturnedClass}`}
                >
                    Details: {item.itemDetail}
                </span>
                {!item.returned && <button
                    data-id={item.id}
                    className="item__send"
                    onClick={(e) => {
                        const id = e.target.dataset.id;
                        onSendNotice(id);
                    }}
                ><img className="icon" src={reminderIcon} alt="reminder button" />Remind</button>}
                <button
                    data-id={item.id}
                    className="item__delete"
                    onClick={(e) => {
                        const id = e.target.dataset.id;
                        onDeleteItem(id);
                    }}
                ><img className="icon" src={deleteIcon} alt="reminder button" />Delete</button>
            </>) :
            (<>
                
                <span
                    data-id={item.id}
                    className="notice__lender"
                >
                    Lender: {item.lender}
                </span>
                <span
                    data-id={item.id}
                    className="notice__lentDate"
                >
                    Lent Date: {item.lentDate}
                </span>
                <span
                    data-id={item.id}
                    className="notice__backDate"
                >
                    Due Date: {item.backDate}
                </span>
                <span
                    data-id={item.id}
                    className="notice__text"
                >
                    Details: {item.itemDetail}
                </span>
                <button
                    data-id={item.id}
                    className="notice__delete"
                    onClick={(e) => {
                        const id = e.target.dataset.id;
                        onDeleteItem(id);
                    }}
                ><img className="icon" src={deleteIcon} alt="reminder button" />Delete</button>
            </>)
        
    );
}

export default Item;