import { useEffect, useRef } from "react";
import { useContext } from "react";
import { AppContext } from "../../store/app-context";
import NotificationItem from "./NotificationItem";

function NotificationPanel({ onClose, bellRef }) {
    const [state] = useContext(AppContext);
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
        <div className="notification-panel" ref={panelRef} role="dialog" aria-label="通知面板">
            <div className="notification-panel__header">
                <h3 className="notification-panel__title">通知</h3>
            </div>
            <div className="notification-panel__body">
                {state.notifications.length === 0 ? (
                    <p className="notification-panel__empty">暂无通知</p>
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
