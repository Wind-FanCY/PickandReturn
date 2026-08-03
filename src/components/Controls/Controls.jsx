import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchLogout } from "../../services/services";
import { AppContext } from "../../store/app-context";
import { ACTIONS } from "../../store/constant";
import { t } from "../../store/i18n";

// 账户下拉菜单:用户名为触发器,展开"修改密码 / 退出登录"。
// 点击外部或按 Esc 关闭(沿用通知面板的交互惯例)。
function Controls() {
    const [state, dispatch] = useContext(AppContext);
    const navigate = useNavigate();
    const lang = state.language;
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;
        function onDocMouseDown(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        function onKeyDown(e) {
            if (e.key === 'Escape') setIsOpen(false);
        }
        document.addEventListener('mousedown', onDocMouseDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [isOpen]);

    function onLogout() {
        setIsOpen(false);
        fetchLogout()
            .then(() => dispatch({ type: ACTIONS.LOG_OUT }))
            .catch(err => dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error }));
    }

    function onChangePassword() {
        setIsOpen(false);
        navigate('/change-password');
    }

    return (
        <div className="controls" ref={containerRef}>
            <button
                type="button"
                className="controls__trigger"
                onClick={() => setIsOpen(open => !open)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-label={t(lang, 'controls.accountMenu')}
            >
                <span className="controls__username">{state.username}</span>
                <span className="controls__caret" aria-hidden="true">▾</span>
            </button>
            {isOpen && (
                <div className="controls__menu" role="menu">
                    <button type="button" role="menuitem" className="controls__menu-item" onClick={onChangePassword}>
                        {t(lang, 'controls.changePassword')}
                    </button>
                    <button type="button" role="menuitem" className="controls__menu-item" onClick={onLogout}>
                        {t(lang, 'controls.logout')}
                    </button>
                </div>
            )}
        </div>
    );
}

export default Controls;
