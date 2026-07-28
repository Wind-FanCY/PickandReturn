import './Footer.css';
import beianIcon from '../../assets/beian_icon.png';

// 网站底部备案信息（工信部要求：备案号 + 链接至 beian.miit.gov.cn）
function Footer() {
    return (
        <footer className="footer">
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
