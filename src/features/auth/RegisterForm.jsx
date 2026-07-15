import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppContext } from "../../store/app-context";
import { fetchRegister } from "../../services/services";
import { ACTIONS } from "../../store/constant";
import { t } from "../../store/i18n";

import Status from '../../components/Status/Status';
import LangToggle from '../../components/LangToggle/LangToggle';
import './LoginForm.css';
import loginIcon from '../../assets/login_icon.png';

function RegisterForm() {
    const [state, dispatch] = useContext(AppContext);
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const lang = state.language;

    function validate() {
        const newErrors = {};
        if (!username) newErrors.username = t(lang, 'auth.usernameRequired');
        else if (!/^[a-zA-Z0-9_]+$/.test(username)) newErrors.username = t(lang, 'auth.usernameInvalid');
        if (!password) newErrors.password = t(lang, 'auth.passwordRequired');
        else if (password.length < 6) newErrors.password = t(lang, 'auth.passwordTooShort');
        if (confirmPassword !== password) newErrors.confirmPassword = t(lang, 'auth.passwordMismatch');
        return newErrors;
    }

    function onSubmit(e) {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }
        setFieldErrors({});

        dispatch({ type: ACTIONS.START_LOADING_ITEMS });
        fetchRegister(username, password)
            .then(() => {
                dispatch({ type: ACTIONS.REPORT_SUCCESS, message: 'success.accountCreated' });
                navigate('/login');
            })
            .catch(err => {
                dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
            });
    }

    return (
        <div className="login">
            <div className="login__lang">
                <LangToggle />
            </div>
            <form className="login__form" onSubmit={onSubmit}>
                <h1 className="login__title">{t(lang, 'auth.registerTitle')}</h1>
                <label className="login__label" htmlFor="username">
                    <span className="label__title">{t(lang, 'auth.usernameLabel')}</span>
                    <input
                        id="username"
                        name="username"
                        className="label__input"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                </label>
                {fieldErrors.username && <p className="login__field-error">{fieldErrors.username}</p>}
                <label className="login__label" htmlFor="password">
                    <span className="label__title">{t(lang, 'auth.passwordLabel')}</span>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        className="label__input"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </label>
                {fieldErrors.password && <p className="login__field-error">{fieldErrors.password}</p>}
                <label className="login__label" htmlFor="confirmPassword">
                    <span className="label__title">{t(lang, 'auth.confirmPasswordLabel')}</span>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        className="label__input"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                    />
                </label>
                {fieldErrors.confirmPassword && <p className="login__field-error">{fieldErrors.confirmPassword}</p>}
                <button className="login__button" type="submit">
                    <img className="icon" src={loginIcon} alt="submit button" />
                    {t(lang, 'auth.registerButton')}
                </button>
                <div className="login__switch">
                    <p className="login__switch-text">
                        {t(lang, 'auth.haveAccount')}{' '}
                        <Link className="login__switch-button" to="/login">{t(lang, 'auth.loginLink')}</Link>
                    </p>
                </div>
                <Status error={state.error} success={state.success} />
            </form>
        </div>
    );
}

export default RegisterForm;
