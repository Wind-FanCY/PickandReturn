import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../store/app-context";
import { t } from "../../store/i18n";
import "./MustChangeBanner.css";

// 首登强提示横幅：当次会话可关闭（不写 localStorage），下次登录若 mustChangePassword
// 仍为 true 会再次出现。非 fixed，作为登录后主内容区最顶部的普通文档流元素。
function MustChangeBanner() {
    const [state] = useContext(AppContext);
    const navigate = useNavigate();
    const [bannerVisible, setBannerVisible] = useState(true);
    const lang = state.language;

    if (!state.mustChangePassword || !bannerVisible) return null;

    return (
        <div className="must-change-banner" role="status">
            <p className="must-change-banner__text">{t(lang, 'mustChange.banner')}</p>
            <button
                type="button"
                className="must-change-banner__action"
                onClick={() => navigate('/change-password')}
            >
                {t(lang, 'mustChange.action')}
            </button>
            <button
                type="button"
                className="must-change-banner__close"
                aria-label={t(lang, 'common.close')}
                onClick={() => setBannerVisible(false)}
            >×</button>
        </div>
    );
}

export default MustChangeBanner;
