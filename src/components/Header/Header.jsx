import { useContext } from "react";
import { AppContext } from "../../store/app-context";
import { LOGIN_STATUS } from "../../store/constant";

import Controls from "../Controls/Controls";
import Nav from "../Nav/Nav";
import "./Header.css";

function Header() {
    const [state, dispatch] = useContext(AppContext);

    return (
        <div className="header">
            <div className="header__top">
                <h1 className="header__title">
                    Pick & Return
                </h1>
                {state.loginStatus === LOGIN_STATUS.IS_LOGGED_IN && <Controls />}
            </div>
            {state.loginStatus === LOGIN_STATUS.IS_LOGGED_IN && <Nav />}
        </div>
    );
}

export default Header;