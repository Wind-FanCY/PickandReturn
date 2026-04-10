import { useContext } from "react";
import { AppContext } from "./app-context";
import { LOGIN_STATUS } from "./constant";

import Controls from "./Controls";
import Nav from "./Nav";
import "./Header.css";

function Header() {
    const [state, dispatch] = useContext(AppContext);

    return (
        <div className="header">
            <h1 className="header__title">
                Pick & Return
            </h1>
            {state.loginStatus === LOGIN_STATUS.IS_LOGGED_IN && <Controls />}
            {state.loginStatus === LOGIN_STATUS.IS_LOGGED_IN && <Nav />}
        </div>
    );
}

export default Header;