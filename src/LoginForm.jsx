import { useContext, useState } from "react";
import { AppContext } from "./app-context";
import { fetchLogin, fetchRegister } from "./services";
import { FORM_MODE } from "./constant";

import Status from './Status';
import './LoginForm.css';
import loginIcon from './assets/login_icon.png';

function LoginForm() {
    const [state, dispatch] = useContext(AppContext);
    const [username, setUsername] = useState('');
    const [mode, setMode] = useState(FORM_MODE.LOGIN);
    const [formError, setFormError] = useState('');

    function validateUsername(value) {
        if (!value) {
            setFormError('Username is required');
            return false;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            setFormError('Only letters, numbers and _ are allowed');
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
                    dispatch({ type: 'reportSuccess', message: 'Account created! You can now log in.' });
                    setMode(FORM_MODE.LOGIN);
                    setUsername('');
                })
                .catch(err => {
                    dispatch({ type: 'reportError', error: err?.error });
                });
        }
        setFormError('');
    }

    function switchToRegister(e) {
        e.preventDefault();
        setMode(FORM_MODE.REGISTER);
        setUsername('');
        setFormError('');
        dispatch({ type: 'reportSuccess', message: '' });
    }

    function switchToLogin(e) {
        e.preventDefault();
        setMode(FORM_MODE.LOGIN);
        setUsername('');
        setFormError('');
        dispatch({ type: 'reportSuccess', message: '' });
    }

    const isLogin = mode === FORM_MODE.LOGIN;

    return (
        <div className="login">
            <form className="login__form" onSubmit={onSubmit}>
                <h1 className="login__title">{isLogin ? 'Login' : 'Register'}</h1>
                <label className="login__label" htmlFor="username">
                    <span className="label__title">Username:</span>
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
                    {isLogin ? 'Login' : 'Create Account'}
                </button>
                <div className="login__switch">
                    {isLogin ? (
                        <p className="login__switch-text">
                            New user?{' '}
                            <button className="login__switch-button" onClick={switchToRegister}>Register</button>
                        </p>
                    ) : (
                        <p className="login__switch-text">
                            Already have an account?{' '}
                            <button className="login__switch-button" onClick={switchToLogin}>Log in</button>
                        </p>
                    )}
                </div>
                <Status error={state.error} success={state.success} />
            </form>
        </div>
    );
}

export default LoginForm;
