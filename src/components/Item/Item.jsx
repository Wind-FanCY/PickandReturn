import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { ACTIONS, RETURN_STATUS } from "../../store/constant";
import { t } from "../../store/i18n";
import {
    fetchDeleteItem,
    fetchSendNotice,
    fetchEditItem,
    fetchUpdateModifyLimit,
    fetchConfirmReturn
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
    const isPending = item.returnStatus === RETURN_STATUS.PENDING;
    const isRequested = item.returnStatus === RETURN_STATUS.REQUESTED;
    const isConfirmed = item.returnStatus === RETURN_STATUS.CONFIRMED;
    const isOverdue = !isConfirmed && new Date(item.backDate) < new Date();

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

    function onConfirmReturn(id) {
        fetchConfirmReturn(id)
            .then(updatedItem => {
                dispatch({ type: ACTIONS.CONFIRM_RETURN, item: updatedItem });
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'success.returnConfirmed' });
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
            .then(updatedItem => {
                dispatch({ type: ACTIONS.EDIT_ITEM, payload: updatedItem });
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
            .then(updatedItem => {
                dispatch({ type: ACTIONS.UPDATE_MODIFY_LIMIT, payload: updatedItem });
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

    if (isConfirmed) {
        return (
            <div className="item__content item__content--confirmed">
                <span className="item__borrower item__text--returned">{t(lang, 'item.borrower')} {item.borrower.username}</span>
                <span className="item__lentDate item__text--returned">{t(lang, 'item.lentDate')} {item.lentDate}</span>
                <span className="item__backDate item__text--returned">{t(lang, 'item.dueDate')} {item.backDate}</span>
                <span className="item__text item__text--returned">{t(lang, 'item.details')} {item.itemDetail}</span>
                <span className="item__returned-tag">{t(lang, 'item.returned')}</span>
            </div>
        );
    }

    return (
        <div className={`item__content${isOverdue ? ' item__content--overdue' : ''}${isRequested ? ' item__content--requested' : ''}`}>
            {isOverdue && <span className="item__overdue-tag">{t(lang, 'item.overdue')}</span>}
            {isRequested && <span className="item__requested-tag">{t(lang, 'item.requestedTag')}</span>}

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
                    <span className="item__borrower">{t(lang, 'item.borrower')} {item.borrower.username}</span>
                    <span className="item__lentDate">{t(lang, 'item.lentDate')} {item.lentDate}</span>
                    <span className="item__backDate">{t(lang, 'item.dueDate')} {item.backDate}</span>
                    <span className="item__text">{t(lang, 'item.details')} {item.itemDetail}</span>
                    {isPending && <button className="item__edit-btn" onClick={() => setIsEditing(true)}>{t(lang, 'item.edit')}</button>}
                </>
            )}

            {isPending && (
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
            )}

            {isPending && (
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

            {isRequested && (
                <button
                    className="item__confirm-return"
                    onClick={() => onConfirmReturn(item.id)}
                >
                    {t(lang, 'item.confirmReturn')}
                </button>
            )}

            {isPending && (
                !confirmingDelete ? (
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
                )
            )}
        </div>
    );
}

export default Item;
