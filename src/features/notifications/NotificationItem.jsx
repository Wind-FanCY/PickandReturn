import { useContext } from "react";
import { AppContext } from "../../store/app-context";
import { ACTIONS, NOTIFICATION_TYPE } from "../../store/constant";
import { fetchDeleteNotification } from "../../services/services";
import "./NotificationItem.css";

function getRelativeTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const todayStr = now.toISOString().slice(0, 10);
    const dateStr = date.toISOString().slice(0, 10);

    if (dateStr === todayStr) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `今天 ${hours}:${minutes}`;
    }

    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
        return '今天';
    }
    return `${diffDays}天前`;
}

function getTypeLabel(type) {
    if (type === NOTIFICATION_TYPE.RETURN_REMINDER) {
        return '还物提醒';
    }
    if (type === NOTIFICATION_TYPE.DATE_MODIFIED) {
        return '日期修改';
    }
    return type;
}

function NotificationItem({ notification }) {
    const [state, dispatch] = useContext(AppContext);

    function handleDelete() {
        fetchDeleteNotification(notification.id)
            .then(() => {
                dispatch({ type: ACTIONS.DELETE_NOTIFICATION, payload: notification.id });
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    return (
        <div className={`notification-item${notification.read === false ? ' notification-item--unread' : ''}`}>
            <div className="notification-item__header">
                <span className="notification-item__type-tag">{getTypeLabel(notification.type)}</span>
                <span className="notification-item__time">{getRelativeTime(notification.createdAt)}</span>
            </div>
            <p className="notification-item__message">{notification.message}</p>
            <button
                className="notification-item__delete"
                onClick={handleDelete}
                aria-label="删除通知"
            >
                删除
            </button>
        </div>
    );
}

export default NotificationItem;
