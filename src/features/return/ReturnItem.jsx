import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { ACTIONS } from "../../store/constant";
import {
    fetchDeleteItem,
    fetchModifyDueDate
} from "../../services/services";
import deleteIcon from "../../assets/delete_icon.png";
import "./ReturnItem.css";

function ReturnItem({ item }) {
    const [state, dispatch] = useContext(AppContext);
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [editingDate, setEditingDate] = useState(false);
    const [newDate, setNewDate] = useState(item.backDate || '');
    const [dateError, setDateError] = useState('');

    const today = new Date().toISOString().slice(0, 10);
    const isOverdue = !item.returned && item.backDate && item.backDate < today;

    const modifyRemaining = item.modifyRemaining !== undefined ? item.modifyRemaining : -1;

    function handleDelete() {
        dispatch({ type: ACTIONS.START_LOADING_ITEMS });
        fetchDeleteItem(item.id)
            .then(() => {
                dispatch({ type: ACTIONS.DELETE_ITEM, id: item.id });
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'Item deleted.' });
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    function handleDateSubmit(e) {
        e.preventDefault();
        setDateError('');

        if (!newDate) {
            setDateError('Please enter a date');
            return;
        }
        if (item.lentDate && newDate < item.lentDate) {
            setDateError('Due date must be on or after lent date');
            return;
        }

        fetchModifyDueDate(item.id, newDate)
            .then(data => {
                dispatch({ type: ACTIONS.MODIFY_DUE_DATE, payload: data.item });
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'Due date updated.' });
                setEditingDate(false);
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    function getModifyLimitLabel() {
        if (modifyRemaining === -1) return '无限次';
        if (modifyRemaining === 0) return null;
        return `剩余 ${modifyRemaining} 次`;
    }

    const modifyLabel = getModifyLimitLabel();

    return (
        <div className={`return-item${isOverdue ? ' return-item--overdue' : ''}`}>
            {isOverdue && <span className="return-item__overdue-tag">Overdue</span>}
            <span className="return-item__lender">出借者: {item.lender}</span>
            <span className="return-item__detail">物品: {item.itemDetail}</span>
            <span className="return-item__lent-date">出借日期: {item.lentDate}</span>
            <span className="return-item__back-date">应还日期: {item.backDate}</span>

            {modifyLabel !== null && (
                <span className="return-item__modify-remaining">{modifyLabel}</span>
            )}

            {modifyRemaining !== 0 && (
                editingDate ? (
                    <form className="return-item__date-form" onSubmit={handleDateSubmit}>
                        <label htmlFor={`new-date-${item.id}`} className="return-item__date-label">
                            <span>新归还日期:</span>
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
                            <button type="submit" className="return-item__date-save">保存</button>
                            <button
                                type="button"
                                className="return-item__date-cancel"
                                onClick={() => { setEditingDate(false); setDateError(''); setNewDate(item.backDate || ''); }}
                            >
                                取消
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        className="return-item__modify-btn"
                        onClick={() => setEditingDate(true)}
                    >
                        修改归还日期
                    </button>
                )
            )}

            {!confirmingDelete ? (
                <button
                    className="return-item__delete"
                    onClick={() => setConfirmingDelete(true)}
                >
                    <img className="icon" src={deleteIcon} alt="delete button" />删除
                </button>
            ) : (
                <div className="return-item__confirm-delete">
                    <span>删除此条目？</span>
                    <button
                        className="return-item__confirm-yes"
                        onClick={() => { setConfirmingDelete(false); handleDelete(); }}
                    >
                        确认
                    </button>
                    <button
                        className="return-item__confirm-no"
                        onClick={() => setConfirmingDelete(false)}
                    >
                        取消
                    </button>
                </div>
            )}
        </div>
    );
}

export default ReturnItem;
