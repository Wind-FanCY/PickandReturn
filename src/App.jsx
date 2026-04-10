import { useReducer, useEffect } from 'react';
import {
  SERVER,
  CLIENT,
  LOGIN_STATUS
} from './store/constant';
import {
  fetchSession,
  fetchItems
} from './services/services';
import reducer, { initialState } from './store/reducer';
import { AppContext } from './store/app-context';

import Header from './components/Header/Header';
import Loading from './components/Loading/Loading';
import LoginForm from './features/auth/LoginForm';
import MainContent from './layout/MainContent';
import './App.css';

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);


  function checkForSession() {
    fetchSession()
      .then(session => {
        dispatch({ type: 'logIn', username: session.username });
        return fetchItems();
      })
      .catch(err => {
        if (err?.error === SERVER.AUTH_MISSING) {
          return Promise.reject({ error: CLIENT.NO_SESSION });
        }
        return Promise.reject(err);
      })
      .then(items => {
        dispatch({ type: 'replaceItems', items: items });
      })
      .catch(err => {
        if (err?.error === CLIENT.NO_SESSION) {
          dispatch({ type: 'logOut' });
          return;
        }
        dispatch({ type: 'reportError', error: err?.error });
      });
  }

  useEffect(
    () => {
      checkForSession();
    },
    []
  );

  return (
    <AppContext.Provider value={ [state, dispatch] }>
      <div className="app">
        <Header />
        {state.loginStatus === LOGIN_STATUS.PENDING && <Loading className="login__waiting">Loading user...</Loading>}
        {state.loginStatus === LOGIN_STATUS.NOT_LOGGED_IN && <LoginForm />}
        {state.loginStatus === LOGIN_STATUS.IS_LOGGED_IN && <MainContent />}
      </div>
    </AppContext.Provider>
  );
}

export default App;
