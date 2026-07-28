import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../../store/app-context';
import { t } from '../../store/i18n';
import './Footer.css';
import beianIcon from '../../assets/beian_icon.png';

// 网站底部备案信息（工信部要求：备案号 + 链接至 beian.miit.gov.cn）+ 隐私政策入口
function Footer() {
    const [state] = useContext(AppContext);
    const lang = state.language;

    return (
        <footer className="footer">
            <Link className="footer__beian" to="/privacy">{t(lang, 'privacy.title')}</Link>
            <a
                className="footer__beian"
                href="http://beian.miit.gov.cn/"
                target="_blank"
                rel="noreferrer"
            >
                豫ICP备2026032349号-1
            </a>
            <img className="footer__icon" src={beianIcon} alt="备案图标" />
            <a 
                className="footer__beian" 
                href="https://beian.mps.gov.cn/#/query/webSearch?code=41170002100053" 
                rel="noreferrer" target="_blank">
                    豫公网安备41170002100053号
            </a>
        </footer>
    );
}

export default Footer;
