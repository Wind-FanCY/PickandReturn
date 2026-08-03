import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { t } from "../../store/i18n";
import Modal from "../../components/Modal/Modal";
import "./BorrowerCredentials.css";

// 借入方凭证一次性回显面板：套在 Modal 内（dismissOnBackdrop=false）。
// 用于建号成功、以及出借方重置初始密码成功后展示 { username, initialPassword }。
function BorrowerCredentials({ username, initialPassword, onDone }) {
    const [state] = useContext(AppContext);
    const lang = state.language;
    const [copyState, setCopyState] = useState('idle');

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(initialPassword);
            setCopyState('success');
        } catch {
            setCopyState('failed');
        }
        setTimeout(() => setCopyState('idle'), 2000);
    }

    const copyAnnouncement =
        copyState === 'success' ? t(lang, 'borrower.copied')
            : copyState === 'failed' ? t(lang, 'borrower.copyFailed')
                : '';

    return (
        <Modal dismissOnBackdrop={false} titleId="borrower-credentials-title" onClose={onDone}>
            <div className="borrower-credentials">
                <h2 id="borrower-credentials-title" className="borrower-credentials__title">
                    {t(lang, 'borrower.credentialsTitle')}
                </h2>
                <dl className="borrower-credentials__fields">
                    <div className="borrower-credentials__field">
                        <dt className="borrower-credentials__label">{t(lang, 'borrower.usernameLabel')}</dt>
                        <dd className="borrower-credentials__value borrower-credentials__value--mono">{username}</dd>
                    </div>
                    <div className="borrower-credentials__field">
                        <dt className="borrower-credentials__label">{t(lang, 'borrower.passwordLabel')}</dt>
                        <dd className="borrower-credentials__value borrower-credentials__value--mono borrower-credentials__value--password">{initialPassword}</dd>
                    </div>
                </dl>
                <button
                    type="button"
                    className={`borrower-credentials__copy${copyState !== 'idle' ? ` borrower-credentials__copy--${copyState}` : ''}`}
                    onClick={handleCopy}
                >
                    {copyState === 'idle' && t(lang, 'borrower.copy')}
                    {copyState === 'success' && t(lang, 'borrower.copied')}
                    {copyState === 'failed' && t(lang, 'borrower.copyFailed')}
                </button>
                <span aria-live="polite" className="sr-only">{copyAnnouncement}</span>
                <p className="borrower-credentials__warning" role="note">{t(lang, 'borrower.credentialsWarning')}</p>
                <button type="button" className="borrower-credentials__done" onClick={onDone}>
                    {t(lang, 'borrower.done')}
                </button>
            </div>
        </Modal>
    );
}

export default BorrowerCredentials;
