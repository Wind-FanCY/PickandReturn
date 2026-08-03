import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { fetchChangePassword } from "../../services/services";
import { ACTIONS } from "../../store/constant";
import { t } from "../../store/i18n";
import Status from "../../components/Status/Status";
import "./ChangePasswordForm.css";

function ChangePasswordForm() {
    const [state, dispatch] = useContext(AppContext);
    const lang = state.language;

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    function onSubmit(e) {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setErrors({ mismatch: true });
            return;
        }
        setErrors({});
        setSuccess(false);
        setSubmitting(true);

        fetchChangePassword(oldPassword, newPassword)
            .then(() => {
                dispatch({ type: ACTIONS.SET_MUST_CHANGE_PASSWORD, value: false });
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setSuccess(true);
                setSubmitting(false);
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
                {success && <p className="change-pwd__success">{t(lang, 'changePwd.success')}</p>}
                <button type="submit" className="change-pwd__submit" disabled={submitting}>
                    {t(lang, 'changePwd.submit')}
                </button>
                <Status error={state.error} success="" />
            </form>
        </div>
    );
}

export default ChangePasswordForm;
