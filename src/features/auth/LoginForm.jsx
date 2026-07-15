import { useContext, useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { AppContext } from "../../store/app-context";
import { fetchLogin } from "../../services/services";
import { loadUserData } from "../../store/load-user-data";
import { ACTIONS, LOGIN_STATUS } from "../../store/constant";
import { t } from "../../store/i18n";
import { localPrefs } from "../../store/local-storage";

import Status from '../../components/Status/Status';
import './LoginForm.css';
import loginIcon from '../../assets/login_icon.png';

const DEMO_USERNAME = 'demo';
const DEMO_PASSWORD = 'demo123';

function LoginForm() {
    const [state, dispatch] = useContext(AppContext);
    const navigate = useNavigate();
    const [username, setUsername] = useState(localPrefs.getLastUsername());
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const lang = state.language;

    // 已登录用户不应停留在登录页（避免与 Header 登录态 UI 重叠）
    if (state.loginStatus === LOGIN_STATUS.IS_LOGGED_IN) {
        return <Navigate to="/items" replace />;
    }

    function validate(u, p) {
        const newErrors = {};
        if (!u) newErrors.username = t(lang, 'auth.usernameRequired');
        else if (!/^[a-zA-Z0-9_]+$/.test(u)) newErrors.username = t(lang, 'auth.usernameInvalid');
        if (!p) newErrors.password = t(lang, 'auth.passwordRequired');
        else if (p.length < 6) newErrors.password = t(lang, 'auth.passwordTooShort');
        return newErrors;
    }

    async function doLogin(u, p) {
        dispatch({ type: ACTIONS.START_LOADING_ITEMS });
        try {
            const session = await fetchLogin(u, p);
            dispatch({ type: ACTIONS.LOG_IN, username: session.username, language: session.language });
            localPrefs.setLastUsername(session.username);
            await loadUserData(dispatch);
            navigate('/items');
        } catch (err) {
            dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
        }
    }

    function onSubmit(e) {
        e.preventDefault();
        const newErrors = validate(username, password);
        if (Object.keys(newErrors).length > 0) {
            setFieldErrors(newErrors);
            return;
        }
        setFieldErrors({});
        doLogin(username, password);
    }

    function onTryDemo() {
        setUsername(DEMO_USERNAME);
        setPassword(DEMO_PASSWORD);
        setFieldErrors({});
        doLogin(DEMO_USERNAME, DEMO_PASSWORD);
    }

    return (
        <div className="login">
            <form className="login__form" onSubmit={onSubmit}>
                <h1 className="login__title">{t(lang, 'auth.loginTitle')}</h1>
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
                <button className="login__button" type="submit">
                    <img className="icon" src={loginIcon} alt="submit button" />
                    {t(lang, 'auth.loginButton')}
                </button>
                <button className="login__demo-button" type="button" onClick={onTryDemo}>
                    {t(lang, 'auth.tryDemo')}
                </button>
                <div className="login__switch">
                    <p className="login__switch-text">
                        {t(lang, 'auth.newUser')}{' '}
                        <Link className="login__switch-button" to="/register">{t(lang, 'auth.registerLink')}</Link>
                    </p>
                </div>
                <Status error={state.error} success={state.success} />
            </form>
        </div>
    );
}

export default LoginForm;
