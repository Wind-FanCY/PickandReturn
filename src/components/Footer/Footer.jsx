import './Footer.css';

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
        </footer>
    );
}

export default Footer;
