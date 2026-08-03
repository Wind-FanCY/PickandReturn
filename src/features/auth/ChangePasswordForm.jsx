import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../store/app-context";
import { fetchChangePassword, fetchLogout } from "../../services/services";
import { ACTIONS } from "../../store/constant";
import { t } from "../../store/i18n";
import Status from "../../components/Status/Status";
import "./ChangePasswordForm.css";

function ChangePasswordForm() {
    const [state, dispatch] = useContext(AppContext);
    const navigate = useNavigate();
    const lang = state.language;

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    function onSubmit(e) {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setErrors({ mismatch: true });
            return;
        }
        setErrors({});
        setSubmitting(true);

        fetchChangePassword(oldPassword, newPassword)
            .then(async () => {
                // 改密已成功。使会话失效并强制用新密码重新登录:服务端删 session +
                // 清空客户端登录态 + 跳登录页,成功提示在登录页 Status 区展示。
                // logout 若因网络失败视为非致命——密码已改,仍照常跳转,
                // 不把用户卡在改密页看到与事实相悖的错误。
                try {
                    await fetchLogout();
                } catch {
                    // 改密成功后登出失败不阻断跳转
                }
                dispatch({ type: ACTIONS.LOG_OUT });
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'changePwd.success' });
                navigate('/login');
            })
            .catch(err => {
                setSubmitting(false);
                if (err?.error === 'wrong-password') {
                    setErrors({ oldPassword: t(lang, 'wrong-password') });
                } else {
                    dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
                }
            });
    }

    return (
        <div className="change-pwd">
            <form className="change-pwd__form" onSubmit={onSubmit}>
                <h1 className="change-pwd__title">{t(lang, 'changePwd.title')}</h1>
                <label className="change-pwd__label">
                    <span className="change-pwd__label-title">{t(lang, 'changePwd.oldLabel')}</span>
                    <input
                        type="password"
                        className="change-pwd__input"
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                    />
                </label>
                {errors.oldPassword && <p className="change-pwd__field-error">{errors.oldPassword}</p>}
                <label className="change-pwd__label">
                    <span className="change-pwd__label-title">{t(lang, 'changePwd.newLabel')}</span>
                    <input
                        type="password"
                        className="change-pwd__input"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                    />
                </label>
                <label className="change-pwd__label">
                    <span className="change-pwd__label-title">{t(lang, 'changePwd.confirmLabel')}</span>
                    <input
                        type="password"
                        className="change-pwd__input"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                    />
                </label>
                {errors.mismatch && <p className="change-pwd__field-error">{t(lang, 'changePwd.mismatch')}</p>}
                <button type="submit" className="change-pwd__submit" disabled={submitting}>
                    {t(lang, 'changePwd.submit')}
                </button>
                <Status error={state.error} success="" />
            </form>
        </div>
    );
}

export default ChangePasswordForm;
