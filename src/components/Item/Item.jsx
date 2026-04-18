import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { ACTIONS } from "../../store/constant";
import { t } from "../../store/i18n";
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

    const lang = state.language;
    const isReturnedClass = item.returned ? "item__text--returned" : "";
    const isOverdue = !item.returned && new Date(item.backDate) < new Date();

    function onDeleteItem(id) {
        dispatch({ type: ACTIONS.START_LOADING_ITEMS });
        fetchDeleteItem(id)
            .then(() => {
                dispatch({ type: ACTIONS.DELETE_ITEM, id: id });
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'success.itemDeleted' });
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    function onToggleLendStatus(id) {
        fetchUpdateItem(id, !state.items[id].returned)
            .then(updatedItem => {
                dispatch({ type: ACTIONS.RETURN_ITEM, item: updatedItem });
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'success.statusUpdated' });
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    function onSendNotice(id) {
        fetchSendNotice(id)
            .then(() => {
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'success.reminderSent' });
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    function onSaveEdit(e) {
        e.preventDefault();
        const newErrors = {};
        if (!editDetail) newErrors.itemDetail = t(lang, 'item.detailRequired');
        if (!editLentDate) newErrors.lentDate = t(lang, 'item.lentDateRequired');
        if (!editBackDate) newErrors.backDate = t(lang, 'item.dueDateRequired');
        if (editLentDate && editBackDate && editBackDate < editLentDate) {
            newErrors.dateRange = t(lang, 'item.dateRange');
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
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'success.itemUpdated' });
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
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'success.modifyLimitUpdated' });
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    const modifyLimit = item.modifyLimit !== undefined ? item.modifyLimit : -1;

    function getModifyLimitLabel(value) {
        if (value === -1) return t(lang, 'item.unlimited');
        if (value === 0) return t(lang, 'item.noModify');
        return lang === 'zh' ? `${value} 次` : `${value} time(s)`;
    }

    return (
        <div className={`item__content${isOverdue ? ' item__content--overdue' : ''}`}>
            {isOverdue && <span className="item__overdue-tag">{t(lang, 'item.overdue')}</span>}
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
                <span className="toggle__title">{t(lang, 'item.returned')}</span>
            </label>

            {isEditing ? (
                <form className="item__edit-form" onSubmit={onSaveEdit}>
                    <label htmlFor={`edit-detail-${item.id}`} className="item__edit-label">
                        <span>{t(lang, 'item.detailsLabel')}</span>
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
                        <span>{t(lang, 'item.lentDateLabel')}</span>
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
                        <span>{t(lang, 'item.dueDateLabel')}</span>
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
                        <button type="submit" className="item__edit-save">{t(lang, 'item.save')}</button>
                        <button type="button" className="item__edit-cancel" onClick={onCancelEdit}>{t(lang, 'item.cancel')}</button>
                    </div>
                </form>
            ) : (
                <>
                    <span className={`item__borrower ${isReturnedClass}`}>{t(lang, 'item.borrower')} {item.borrower}</span>
                    <span className={`item__lentDate ${isReturnedClass}`}>{t(lang, 'item.lentDate')} {item.lentDate}</span>
                    <span className={`item__backDate ${isReturnedClass}`}>{t(lang, 'item.dueDate')} {item.backDate}</span>
                    <span className={`item__text ${isReturnedClass}`}>{t(lang, 'item.details')} {item.itemDetail}</span>
                    <button className="item__edit-btn" onClick={() => setIsEditing(true)}>{t(lang, 'item.edit')}</button>
                </>
            )}

            <div className="item__modify-limit">
                <label htmlFor={`modify-limit-${item.id}`} className="item__modify-limit-label">
                    <span>{t(lang, 'item.modifyLimit')}</span>
                    <select
                        id={`modify-limit-${item.id}`}
                        className="item__modify-limit-select"
                        value={modifyLimit}
                        onChange={onModifyLimitChange}
                    >
                        <option value="-1">{t(lang, 'item.unlimited')}</option>
                        <option value="0">{t(lang, 'item.noModify')}</option>
                        <option value="1">{t(lang, 'item.1time')}</option>
                        <option value="3">{t(lang, 'item.3times')}</option>
                        <option value="5">{t(lang, 'item.5times')}</option>
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
                    <img className="icon" src={reminderIcon} alt="reminder button" />{t(lang, 'item.remind')}
                </button>
            )}

            {!confirmingDelete ? (
                <button
                    className="item__delete"
                    onClick={() => setConfirmingDelete(true)}
                >
                    <img className="icon" src={deleteIcon} alt="delete button" />{t(lang, 'item.delete')}
                </button>
            ) : (
                <div className="item__confirm-delete">
                    <span>{t(lang, 'item.confirmDelete')}</span>
                    <button
                        className="item__confirm-yes"
                        onClick={() => { setConfirmingDelete(false); onDeleteItem(item.id); }}
                    >
                        {t(lang, 'item.confirm')}
                    </button>
                    <button
                        className="item__confirm-no"
                        onClick={() => setConfirmingDelete(false)}
                    >
                        {t(lang, 'item.cancel')}
                    </button>
                </div>
            )}
        </div>
    );
}

export default Item;
