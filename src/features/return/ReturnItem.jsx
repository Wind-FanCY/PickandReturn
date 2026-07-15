import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { ACTIONS, RETURN_STATUS } from "../../store/constant";
import { t } from "../../store/i18n";
import {
    fetchModifyDueDate,
    fetchRequestReturn
} from "../../services/services";
import "./ReturnItem.css";

function ReturnItem({ item }) {
    const [state, dispatch] = useContext(AppContext);
    const [editingDate, setEditingDate] = useState(false);
    const [newDate, setNewDate] = useState(item.backDate || '');
    const [dateError, setDateError] = useState('');

    const lang = state.language;
    const today = new Date().toISOString().slice(0, 10);
    const isPending = item.returnStatus === RETURN_STATUS.PENDING;
    const isRequested = item.returnStatus === RETURN_STATUS.REQUESTED;
    const isConfirmed = item.returnStatus === RETURN_STATUS.CONFIRMED;
    const isOverdue = !isConfirmed && item.backDate && item.backDate < today;

    const modifyRemaining = item.modifyRemaining !== undefined ? item.modifyRemaining : -1;

    function handleDateSubmit(e) {
        e.preventDefault();
        setDateError('');

        if (!newDate) {
            setDateError(t(lang, 'return.dateRequired'));
            return;
        }
        if (item.lentDate && newDate < item.lentDate) {
            setDateError(t(lang, 'return.dateRange'));
            return;
        }

        fetchModifyDueDate(item.id, newDate)
            .then(updatedItem => {
                dispatch({ type: ACTIONS.MODIFY_DUE_DATE, payload: updatedItem });
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'success.dueDateUpdated' });
                setEditingDate(false);
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    function onRequestReturn() {
        fetchRequestReturn(item.id)
            .then(updatedItem => {
                dispatch({ type: ACTIONS.REQUEST_RETURN, item: updatedItem });
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'success.returnRequested' });
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    function getModifyLimitLabel() {
        if (modifyRemaining === -1) return t(lang, 'return.unlimited');
        if (modifyRemaining === 0) return null;
        return t(lang, 'return.remaining', modifyRemaining);
    }

    const modifyLabel = getModifyLimitLabel();

    if (isConfirmed) {
        return (
            <div className="return-item return-item--confirmed">
                <span className="return-item__lender">{t(lang, 'return.lender')} {item.lender.username}</span>
                <span className="return-item__detail">{t(lang, 'return.detail')} {item.itemDetail}</span>
                <span className="return-item__lent-date">{t(lang, 'return.lentDate')} {item.lentDate}</span>
                <span className="return-item__back-date">{t(lang, 'return.backDate')} {item.backDate}</span>
                <span className="return-item__returned-tag">{t(lang, 'item.returned')}</span>
            </div>
        );
    }

    return (
        <div className={`return-item${isOverdue ? ' return-item--overdue' : ''}${isRequested ? ' return-item--requested' : ''}`}>
            {isOverdue && <span className="return-item__overdue-tag">{t(lang, 'return.overdue')}</span>}
            {isRequested && <span className="return-item__requested-tag">{t(lang, 'return.requestedTag')}</span>}
            <span className="return-item__lender">{t(lang, 'return.lender')} {item.lender.username}</span>
            <span className="return-item__detail">{t(lang, 'return.detail')} {item.itemDetail}</span>
            <span className="return-item__lent-date">{t(lang, 'return.lentDate')} {item.lentDate}</span>
            <span className="return-item__back-date">{t(lang, 'return.backDate')} {item.backDate}</span>

            {isPending && modifyLabel !== null && (
                <span className="return-item__modify-remaining">{modifyLabel}</span>
            )}

            {isPending && modifyRemaining !== 0 && (
                editingDate ? (
                    <form className="return-item__date-form" onSubmit={handleDateSubmit}>
                        <label htmlFor={`new-date-${item.id}`} className="return-item__date-label">
                            <span>{t(lang, 'return.newDueDate')}</span>
                            <input
                                id={`new-date-${item.id}`}
                                className="return-item__date-input"
                                type="date"
                                value={newDate}
                                onChange={e => setNewDate(e.target.value)}
                            />
                        </label>
                        {dateError && <span className="return-item__date-error">{dateError}</span>}
                        <div className="return-item__date-actions">
                            <button type="submit" className="return-item__date-save">{t(lang, 'return.save')}</button>
                            <button
                                type="button"
                                className="return-item__date-cancel"
                                onClick={() => { setEditingDate(false); setDateError(''); setNewDate(item.backDate || ''); }}
                            >
                                {t(lang, 'return.cancel')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        className="return-item__modify-btn"
                        onClick={() => setEditingDate(true)}
                    >
                        {t(lang, 'return.modify')}
                    </button>
                )
            )}

            {isPending && (
                <button className="return-item__request-btn" onClick={onRequestReturn}>
                    {t(lang, 'return.requestReturn')}
                </button>
            )}

            {isRequested && (
                <button className="return-item__waiting-btn" disabled>
                    {t(lang, 'return.waitingConfirm')}
                </button>
            )}
        </div>
    );
}

export default ReturnItem;
