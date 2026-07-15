import { useContext } from "react";
import { AppContext } from "../../store/app-context";
import { ACTIONS, NOTIFICATION_TYPE } from "../../store/constant";
import { fetchDeleteNotification } from "../../services/services";
import { t } from "../../store/i18n";
import "./NotificationItem.css";

function getRelativeTime(dateString, lang) {
    const now = new Date();
    const date = new Date(dateString);
    const todayStr = now.toISOString().slice(0, 10);
    const dateStr = date.toISOString().slice(0, 10);

    if (dateStr === todayStr) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return t(lang, 'notif.today', hours, minutes);
    }

    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
        return t(lang, 'notif.todayShort');
    }
    return t(lang, 'notif.daysAgo', diffDays);
}

function getTypeLabel(type, lang) {
    if (type === NOTIFICATION_TYPE.RETURN_REMINDER) {
        return t(lang, 'notif.reminderTitle');
    }
    if (type === NOTIFICATION_TYPE.DATE_MODIFIED) {
        return t(lang, 'notif.dateModifiedTitle');
    }
    if (type === NOTIFICATION_TYPE.RETURN_REQUESTED) {
        return t(lang, 'notif.returnRequestedTitle');
    }
    if (type === NOTIFICATION_TYPE.RETURN_CONFIRMED) {
        return t(lang, 'notif.returnConfirmedTitle');
    }
    return type;
}

function getTypeClass(type) {
    if (type === NOTIFICATION_TYPE.DATE_MODIFIED || type === NOTIFICATION_TYPE.RETURN_REQUESTED) {
        return 'notification-item__type-tag--warning';
    }
    if (type === NOTIFICATION_TYPE.RETURN_CONFIRMED) {
        return 'notification-item__type-tag--success';
    }
    return '';
}

function NotificationItem({ notification }) {
    const [state, dispatch] = useContext(AppContext);
    const lang = state.language;

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
                <span className={`notification-item__type-tag ${getTypeClass(notification.type)}`.trim()}>{getTypeLabel(notification.type, lang)}</span>
                <span className="notification-item__time">{getRelativeTime(notification.createdAt, lang)}</span>
            </div>
            <p className="notification-item__message">{notification.message}</p>
            <button
                className="notification-item__delete"
                onClick={handleDelete}
                aria-label={t(lang, 'notif.deleteLabel')}
            >
                {t(lang, 'notif.delete')}
            </button>
        </div>
    );
}

export default NotificationItem;
