import { useContext } from "react";
import { AppContext } from "../../store/app-context";
import { ACTIONS } from "../../store/constant";
import { fetchMarkNotificationsRead } from "../../services/services";
import { t } from "../../store/i18n";
import NotificationItem from "./NotificationItem";
import "./NotificationsPage.css";

function NotificationsPage() {
    const [state, dispatch] = useContext(AppContext);
    const lang = state.language;

    function onMarkAllRead() {
        fetchMarkNotificationsRead()
            .then(data => {
                dispatch({ type: ACTIONS.MARK_NOTIFICATIONS_READ, payload: data.notifications });
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    return (
        <main className="notifications-page">
            <div className="notifications-page__header">
                <h1 className="notifications-page__title">{t(lang, 'notif.title')}</h1>
                {state.unreadCount > 0 && (
                    <button className="notifications-page__mark-read" onClick={onMarkAllRead}>
                        {t(lang, 'notif.markAllRead')}
                    </button>
                )}
            </div>
            {state.notifications.length === 0 ? (
                <p className="notifications-page__empty">{t(lang, 'notif.noNotifications')}</p>
            ) : (
                <ul className="notifications-page__list">
                    {state.notifications.map(notification => (
                        <li key={notification.id}>
                            <NotificationItem notification={notification} />
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}

export default NotificationsPage;
