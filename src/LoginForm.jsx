import { useContext, useState } from "react";
import { AppContext } from "./app-context";
import { fetchLogin } from "./services";
    
import Status from './Status';
import './LoginForm.css';
import loginIcon from './assets/login_icon.png';

function LoginForm() {
    const [state, dispatch] = useContext(AppContext);
    const [username, setUsername] = useState('');
    
    function onLogin(username) {
        dispatch({ type: 'startLoadingItems' });
        fetchLogin(username)
          .then(fetchedItems => {
            dispatch({ type: 'logIn', username: username });
            dispatch({ type: 'replaceItems', items: fetchedItems });
          })
          .catch(err => {
            dispatch({ type: 'reportError', error: err?.error });
          });
    }

    function onChange(e) {
        setUsername(e.target.value);
    }

    function onSubmit(e) {
        e.preventDefault();
        onLogin(username);
        setUsername('');
    }

    return (
        <div className="login">
            <form className="login__form" onSubmit={onSubmit}>
                <h1 className="login__title">Login</h1>
                <label className="login__label" htmlFor="username">
                    <span className="label__title">Username:</span>
                    <input id="username" name="username" className="label__input" value={username} onChange={onChange}/>
                </label>
                <button className="login__button" type="submit"><img className="icon" src={loginIcon} alt="login button" /> Login</button>
                {state.error && <Status error={state.error} />}
            </form>
        </div>
    );
}

export default LoginForm;