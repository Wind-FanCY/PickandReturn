import { useEffect, useRef } from "react";
import { useContext } from "react";
import { AppContext } from "../../store/app-context";
import { t } from "../../store/i18n";
import NotificationItem from "./NotificationItem";

function NotificationPanel({ onClose, bellRef }) {
    const [state] = useContext(AppContext);
    const lang = state.language;
    const panelRef = useRef(null);

    useEffect(() => {
        function handleDocumentClick(e) {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target) &&
                bellRef.current &&
                !bellRef.current.contains(e.target)
            ) {
                onClose();
            }
        }

        document.addEventListener('mousedown', handleDocumentClick);
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, [onClose, bellRef]);

    return (
        <div className="notification-panel" ref={panelRef} role="dialog" aria-label={t(lang, 'notif.panelLabel')}>
            <div className="notification-panel__header">
                <h3 className="notification-panel__title">{t(lang, 'notif.title')}</h3>
            </div>
            <div className="notification-panel__body">
                {state.notifications.length === 0 ? (
                    <p className="notification-panel__empty">{t(lang, 'notif.noNotifications')}</p>
                ) : (
                    <ul className="notification-panel__list">
                        {state.notifications.map(notification => (
                            <li key={notification.id}>
                                <NotificationItem notification={notification} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default NotificationPanel;
