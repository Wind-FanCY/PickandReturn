import { useContext } from "react";
import { AppContext } from "../../store/app-context";
import { LOGIN_STATUS } from "../../store/constant";

import Controls from "../Controls/Controls";
import Nav from "../Nav/Nav";
import LangToggle from "../LangToggle/LangToggle";
import "./Header.css";

function Header() {
    const [state] = useContext(AppContext);
    const isLoggedIn = state.loginStatus === LOGIN_STATUS.IS_LOGGED_IN;

    return (
        <div className="header">
            <div className="header__top">
                <h1 className="header__title">
                    Pick & Return
                </h1>
                {isLoggedIn
                    ? <Controls />
                    : <div className="header__right"><LangToggle /></div>}
            </div>
            {isLoggedIn && <Nav />}
        </div>
    );
}

export default Header;