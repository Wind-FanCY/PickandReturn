import { useContext, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AppContext } from "../../store/app-context";
import { t } from "../../store/i18n";
import "./Modal.css";

// 通用 Modal：createPortal 到 body。范围锁死（不做）：无开合动画、无完整焦点捕获、不支持多层堆叠。
function Modal({ titleId, onClose, dismissOnBackdrop, children }) {
    const [state] = useContext(AppContext);
    const lang = state.language;
    const panelRef = useRef(null);

    useEffect(() => {
        const panel = panelRef.current;
        if (!panel) return;
        const focusable = panel.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) {
            focusable.focus();
        } else {
            panel.setAttribute('tabindex', '-1');
            panel.focus();
        }
    }, []);

    useEffect(() => {
        if (!dismissOnBackdrop) return;
        function onKeyDown(e) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [dismissOnBackdrop, onClose]);

    return createPortal(
        <div className="modal" onClick={dismissOnBackdrop ? onClose : undefined}>
            <div
                className="modal__panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={(e) => e.stopPropagation()}
                ref={panelRef}
            >
                <button
                    className="modal__close"
                    type="button"
                    aria-label={t(lang, 'common.close')}
                    onClick={onClose}
                >×</button>
                <div className="modal__content">{children}</div>
            </div>
        </div>,
        document.body
    );
}

export default Modal;
