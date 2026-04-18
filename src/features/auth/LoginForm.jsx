import { useContext, useState } from "react";
import { AppContext } from "../../store/app-context";
import { fetchLogin, fetchRegister } from "../../services/services";
import { FORM_MODE } from "../../store/constant";
import { t } from "../../store/i18n";

import Status from '../../components/Status/Status';
import LangToggle from '../../components/LangToggle/LangToggle';
import './LoginForm.css';
import loginIcon from '../../assets/login_icon.png';

function LoginForm() {
    const [state, dispatch] = useContext(AppContext);
    const [username, setUsername] = useState('');
    const [mode, setMode] = useState(FORM_MODE.LOGIN);
    const [formError, setFormError] = useState('');

    const lang = state.language;

    function validateUsername(value) {
        if (!value) {
            setFormError(t(lang, 'auth.usernameRequired'));
            return false;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            setFormError(t(lang, 'auth.usernameInvalid'));
            return false;
        }
        setFormError('');
        return true;
    }

    function onChange(e) {
        const value = e.target.value;
        setUsername(value);
        if (value) validateUsername(value);
        else setFormError('');
    }

    function onSubmit(e) {
        e.preventDefault();
        if (!validateUsername(username)) return;

        if (mode === FORM_MODE.LOGIN) {
            dispatch({ type: 'startLoadingItems' });
            fetchLogin(username)
                .then(fetchedItems => {
                    dispatch({ type: 'logIn', username: username });
                    dispatch({ type: 'replaceItems', items: fetchedItems });
                })
                .catch(err => {
                    dispatch({ type: 'reportError', error: err?.error });
                });
        } else {
            dispatch({ type: 'startLoadingItems' });
            fetchRegister(username)
                .then(() => {
                    dispatch({ type: 'reportSuccess', message: 'success.accountCreated' });
                    setMode(FORM_MODE.LOGIN);
                    setUsername('');
                })
                .catch(err => {
                    dispatch({ type: 'reportError', error: err?.error });
                });
        }
        setFormError('');
    }

    const createModeSwitcher = (newMode) => (e) => {
        e.preventDefault();
        setMode(newMode);
        setUsername('');
        setFormError('');
        dispatch({ type: 'reportSuccess', message: '' });
    };
    const switchToRegister = createModeSwitcher(FORM_MODE.REGISTER);
    const switchToLogin    = createModeSwitcher(FORM_MODE.LOGIN);

    const isLogin = mode === FORM_MODE.LOGIN;

    return (
        <div className="login">
            <div className="login__lang">
                <LangToggle />
            </div>
            <form className="login__form" onSubmit={onSubmit}>
                <h1 className="login__title">{isLogin ? t(lang, 'auth.loginTitle') : t(lang, 'auth.registerTitle')}</h1>
                <label className="login__label" htmlFor="username">
                    <span className="label__title">{t(lang, 'auth.usernameLabel')}</span>
                    <input
                        id="username"
                        name="username"
                        className="label__input"
                        value={username}
                        onChange={onChange}
                    />
                </label>
                {formError && <p className="login__field-error">{formError}</p>}
                <button className="login__button" type="submit">
                    <img className="icon" src={loginIcon} alt="submit button" />
                    {isLogin ? t(lang, 'auth.loginButton') : t(lang, 'auth.registerButton')}
                </button>
                <div className="login__switch">
                    {isLogin ? (
                        <p className="login__switch-text">
                            {t(lang, 'auth.newUser')}{' '}
                            <button className="login__switch-button" onClick={switchToRegister}>{t(lang, 'auth.registerLink')}</button>
                        </p>
                    ) : (
                        <p className="login__switch-text">
                            {t(lang, 'auth.haveAccount')}{' '}
                            <button className="login__switch-button" onClick={switchToLogin}>{t(lang, 'auth.loginLink')}</button>
                        </p>
                    )}
                </div>
                <Status error={state.error} success={state.success} />
            </form>
        </div>
    );
}

export default LoginForm;
