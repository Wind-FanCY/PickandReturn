import { useReducer, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  SERVER,
  LOGIN_STATUS,
  ACTIONS
} from './store/constant';
import { fetchSession } from './services/services';
import { loadUserData } from './store/load-user-data';
import reducer, { initialState } from './store/reducer';
import { AppContext } from './store/app-context';

import Header from './components/Header/Header';
import Loading from './components/Loading/Loading';
import ProtectedRoute from './components/ProtectedRoute';
import TabBar from './components/TabBar/TabBar';
import Footer from './components/Footer/Footer';
import NotFoundPage from './components/NotFoundPage/NotFoundPage';
import MainContent from './layout/MainContent';
import LoginForm from './features/auth/LoginForm';
import RegisterForm from './features/auth/RegisterForm';
import ItemsPage from './features/items/ItemsPage';
import ReturnPage from './features/return/ReturnPage';
import NotificationsPage from './features/notifications/NotificationsPage';
import './App.css';

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  async function checkForSession() {
    try {
      const session = await fetchSession();
      dispatch({ type: ACTIONS.LOG_IN, username: session.username, language: session.language || 'zh' });
      await loadUserData(dispatch);
    } catch (err) {
      if (err?.error === SERVER.AUTH_MISSING) {
        dispatch({ type: ACTIONS.LOG_OUT });
        return;
      }
      dispatch({ type: ACTIONS.REPORT_ERROR, error: err?.error });
    }
  }

  useEffect(
    () => {
      checkForSession();
    },
    []
  );

  return (
    <AppContext.Provider value={ [state, dispatch] }>
      <div className={`app${state.loginStatus === LOGIN_STATUS.IS_LOGGED_IN ? ' app--has-tabbar' : ''}`}>
        <Header />
        <Routes>
          <Route
            path="/"
            element={
              state.loginStatus === LOGIN_STATUS.PENDING
                ? <Loading className="login__waiting">Loading user...</Loading>
                : <Navigate to={state.loginStatus === LOGIN_STATUS.IS_LOGGED_IN ? '/items' : '/login'} replace />
            }
          />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/items" element={
            <ProtectedRoute>
              <MainContent><ItemsPage /></MainContent>
            </ProtectedRoute>
          } />
          <Route path="/return" element={
            <ProtectedRoute>
              <MainContent><ReturnPage /></MainContent>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <MainContent><NotificationsPage /></MainContent>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Footer />
        {state.loginStatus === LOGIN_STATUS.IS_LOGGED_IN && <TabBar />}
      </div>
    </AppContext.Provider>
  );
}

export default App;
