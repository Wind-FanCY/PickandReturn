import { useContext, useState, useRef } from "react";
import { AppContext } from "../../store/app-context";
import { ACTIONS } from "../../store/constant";
import { fetchMarkNotificationsRead } from "../../services/services";
import NotificationPanel from "./NotificationPanel";
import "./NotificationBell.css";

function NotificationBell() {
    const [state, dispatch] = useContext(AppContext);
    const [isOpen, setIsOpen] = useState(false);
    const bellRef = useRef(null);

    function handleBellClick() {
        if (!isOpen) {
            fetchMarkNotificationsRead()
                .then(data => {
                    dispatch({ type: ACTIONS.MARK_NOTIFICATIONS_READ, payload: data.notifications });
                })
                .catch(() => {
                    // 标记已读失败不影响展开面板
                });
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }

    function handleClose() {
        setIsOpen(false);
    }

    return (
        <div className="notification-bell" ref={bellRef}>
            <button
                className="notification-bell__button"
                onClick={handleBellClick}
                aria-label="通知"
                aria-expanded={isOpen}
            >
                <span className="notification-bell__icon" aria-hidden="true">🔔</span>
                {state.unreadCount > 0 && (
                    <span className="notification-bell__badge" aria-label={`${state.unreadCount} 条未读通知`}>
                        {state.unreadCount}
                    </span>
                )}
            </button>
            {isOpen && <NotificationPanel onClose={handleClose} bellRef={bellRef} />}
        </div>
    );
}

export default NotificationBell;
