import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { ACTIONS } from "../../store/constant";
import {
    fetchDeleteItem,
    fetchUpdateItem,
    fetchSendNotice,
    fetchEditItem,
    fetchUpdateModifyLimit
} from "../../services/services";

import reminderIcon from "../../assets/reminder_icon.png";
import deleteIcon from "../../assets/delete_icon.png";
import "./Item.css";

function Item({ item }) {
    const [state, dispatch] = useContext(AppContext);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editDetail, setEditDetail] = useState(item.itemDetail || '');
    const [editBackDate, setEditBackDate] = useState(item.backDate || '');
    const [editLentDate, setEditLentDate] = useState(item.lentDate || '');
    const [editErrors, setEditErrors] = useState({});

    const isReturnedClass = item.returned ? "item__text--returned" : "";
    const isOverdue = !item.returned && new Date(item.backDate) < new Date();

    function onDeleteItem(id) {
        dispatch({ type: ACTIONS.START_LOADING_ITEMS });
        fetchDeleteItem(id)
            .then(() => {
                dispatch({ type: ACTIONS.DELETE_ITEM, id: id });
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'Item deleted.' });
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    function onToggleLendStatus(id) {
        fetchUpdateItem(id, !state.items[id].returned)
            .then(updatedItem => {
                dispatch({ type: ACTIONS.RETURN_ITEM, item: updatedItem });
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'Status updated.' });
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    function onSendNotice(id) {
        fetchSendNotice(id)
            .then(() => {
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'Reminder sent!' });
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    function onSaveEdit(e) {
        e.preventDefault();
        const newErrors = {};
        if (!editDetail) newErrors.itemDetail = 'Item details are required';
        if (!editLentDate) newErrors.lentDate = 'Lent date is required';
        if (!editBackDate) newErrors.backDate = 'Due date is required';
        if (editLentDate && editBackDate && editBackDate < editLentDate) {
            newErrors.dateRange = 'Due date must be on or after lent date';
        }
        if (Object.keys(newErrors).length > 0) {
            setEditErrors(newErrors);
            return;
        }
        setEditErrors({});

        const updates = {
            itemDetail: editDetail,
            backDate: editBackDate,
            lentDate: editLentDate
        };

        fetchEditItem(item.id, updates)
            .then(data => {
                dispatch({ type: ACTIONS.EDIT_ITEM, payload: data.item });
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'Item updated.' });
                setIsEditing(false);
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    function onCancelEdit() {
        setEditDetail(item.itemDetail || '');
        setEditBackDate(item.backDate || '');
        setEditLentDate(item.lentDate || '');
        setEditErrors({});
        setIsEditing(false);
    }

    function onModifyLimitChange(e) {
        const newLimit = parseInt(e.target.value, 10);
        fetchUpdateModifyLimit(item.id, newLimit)
            .then(data => {
                dispatch({ type: ACTIONS.UPDATE_MODIFY_LIMIT, payload: data.item });
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'Modify limit updated.' });
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    const modifyLimit = item.modifyLimit !== undefined ? item.modifyLimit : -1;

    function getModifyLimitLabel(value) {
        if (value === -1) return '无限次';
        if (value === 0) return '禁止修改';
        return `${value} 次`;
    }

    return (
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

            {isEditing ? (
                <form className="item__edit-form" onSubmit={onSaveEdit}>
                    <label htmlFor={`edit-detail-${item.id}`} className="item__edit-label">
                        <span>Details:</span>
                        <input
                            id={`edit-detail-${item.id}`}
                            className="item__edit-input"
                            type="text"
                            value={editDetail}
                            onChange={e => setEditDetail(e.target.value)}
                        />
                    </label>
                    {editErrors.itemDetail && <span className="item__edit-error">{editErrors.itemDetail}</span>}
                    <label htmlFor={`edit-lent-${item.id}`} className="item__edit-label">
                        <span>Lent Date:</span>
                        <input
                            id={`edit-lent-${item.id}`}
                            className="item__edit-input"
                            type="date"
                            value={editLentDate}
                            onChange={e => setEditLentDate(e.target.value)}
                        />
                    </label>
                    {editErrors.lentDate && <span className="item__edit-error">{editErrors.lentDate}</span>}
                    <label htmlFor={`edit-back-${item.id}`} className="item__edit-label">
                        <span>Due Date:</span>
                        <input
                            id={`edit-back-${item.id}`}
                            className="item__edit-input"
                            type="date"
                            value={editBackDate}
                            onChange={e => setEditBackDate(e.target.value)}
                        />
                    </label>
                    {editErrors.backDate && <span className="item__edit-error">{editErrors.backDate}</span>}
                    {editErrors.dateRange && <span className="item__edit-error">{editErrors.dateRange}</span>}
                    <div className="item__edit-actions">
                        <button type="submit" className="item__edit-save">Save</button>
                        <button type="button" className="item__edit-cancel" onClick={onCancelEdit}>Cancel</button>
                    </div>
                </form>
            ) : (
                <>
                    <span className={`item__borrower ${isReturnedClass}`}>Borrower: {item.borrower}</span>
                    <span className={`item__lentDate ${isReturnedClass}`}>Lent Date: {item.lentDate}</span>
                    <span className={`item__backDate ${isReturnedClass}`}>Due Date: {item.backDate}</span>
                    <span className={`item__text ${isReturnedClass}`}>Details: {item.itemDetail}</span>
                    <button className="item__edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
                </>
            )}

            <div className="item__modify-limit">
                <label htmlFor={`modify-limit-${item.id}`} className="item__modify-limit-label">
                    <span>可修改次数:</span>
                    <select
                        id={`modify-limit-${item.id}`}
                        className="item__modify-limit-select"
                        value={modifyLimit}
                        onChange={onModifyLimitChange}
                    >
                        <option value="-1">无限次</option>
                        <option value="0">禁止修改</option>
                        <option value="1">1 次</option>
                        <option value="3">3 次</option>
                        <option value="5">5 次</option>
                    </select>
                </label>
            </div>

            {!item.returned && (
                <button
                    data-id={item.id}
                    className="item__send"
                    onClick={(e) => {
                        const id = e.target.closest('button').dataset.id;
                        onSendNotice(id);
                    }}
                >
                    <img className="icon" src={reminderIcon} alt="reminder button" />Remind
                </button>
            )}

            {!confirmingDelete ? (
                <button
                    className="item__delete"
                    onClick={() => setConfirmingDelete(true)}
                >
                    <img className="icon" src={deleteIcon} alt="delete button" />Delete
                </button>
            ) : (
                <div className="item__confirm-delete">
                    <span>Delete this item?</span>
                    <button
                        className="item__confirm-yes"
                        onClick={() => { setConfirmingDelete(false); onDeleteItem(item.id); }}
                    >
                        Confirm
                    </button>
                    <button
                        className="item__confirm-no"
                        onClick={() => setConfirmingDelete(false)}
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}

export default Item;
