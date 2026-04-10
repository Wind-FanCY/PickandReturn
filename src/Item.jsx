import { useContext, useState } from "react";
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
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const isReturnedClass = item.returned ? "item__text--returned" : "";
    const isOverdue = !item.returned && new Date(item.backDate) < new Date();

    function onDeleteItem(id) {
        dispatch({ type: 'startLoadingItems' });
        fetchDeleteItem(id)
            .then(() => {
                dispatch({ type: 'deleteItem', id: id });
                dispatch({ type: 'reportSuccess', message: 'Item deleted.' });
            })
            .catch(err => {
                dispatch({ type: 'reportError', error: err?.error });
            });
    }

    function onToggleLendStatus(id) {
        fetchUpdateItem(id, !state.items[id].returned)
            .then(item => {
                dispatch({ type: 'returnItem', item: item });
                dispatch({ type: 'reportSuccess', message: 'Status updated.' });
            })
            .catch(err => {
                dispatch({ type: 'reportError', error: err?.error });
            });
    }

    function onSendNotice(id) {
        fetchSendNotice(id)
            .then(item => {
                dispatch({ type: 'sendNotice', item: item });
                dispatch({ type: 'reportSuccess', message: 'Reminder sent!' });
            })
            .catch(err => {
                dispatch({ type: 'reportError', error: err?.error });
            });
    }

    return (
        item.lender === state.username ? (
            <div className={`item__content${isOverdue ? ' item__content--overdue' : ''}`}>
                {isOverdue && <span className="item__overdue-tag">Overdue</span>}
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
                {!confirmingDelete ? (
                    <button
                        className="item__delete"
                        onClick={() => setConfirmingDelete(true)}
                    ><img className="icon" src={deleteIcon} alt="delete button" />Delete</button>
                ) : (
                    <div className="item__confirm-delete">
                        <span>Delete this item?</span>
                        <button className="item__confirm-yes" onClick={() => { setConfirmingDelete(false); onDeleteItem(item.id); }}>Confirm</button>
                        <button className="item__confirm-no" onClick={() => setConfirmingDelete(false)}>Cancel</button>
                    </div>
                )}
            </div>
        ) : (
            <div className={`item__content${isOverdue ? ' item__content--overdue' : ''}`}>
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
                {!confirmingDelete ? (
                    <button
                        className="notice__delete"
                        onClick={() => setConfirmingDelete(true)}
                    ><img className="icon" src={deleteIcon} alt="delete button" />Delete</button>
                ) : (
                    <div className="item__confirm-delete">
                        <span>Delete this item?</span>
                        <button className="item__confirm-yes" onClick={() => { setConfirmingDelete(false); onDeleteItem(item.id); }}>Confirm</button>
                        <button className="item__confirm-no" onClick={() => setConfirmingDelete(false)}>Cancel</button>
                    </div>
                )}
            </div>
        )
    );
}

export default Item;
