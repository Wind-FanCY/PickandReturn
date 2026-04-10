import { useContext } from "react";
import { AppContext } from "./app-context";
import { PAGE_STATUS } from "./constant";

import ItemsPage from "./ItemsPage";
import NoticesPage from "./NoticesPage";

function MainContent() {
    const [state, dispatch] = useContext(AppContext);

    return (
        <div className="main-content">
            {state.pageStatus === PAGE_STATUS.ITEMS_PAGE && <ItemsPage />}
            {state.pageStatus === PAGE_STATUS.NOTICES_PAGE && <NoticesPage />}
        </div>
    )
}

export default MainContent;