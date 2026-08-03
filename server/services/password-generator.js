// 初始密码生成：出借方自动建号 / 出借方重置借入方密码 复用。
// crypto 强随机（禁 Math.random），排除易混字符 0 O o 1 l I。
import { randomInt } from 'crypto';

const PASSWORD_LENGTH = 12;
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

// 返回明文密码；调用方负责 bcrypt.hash。明文绝不落库、绝不进日志。
export function generatePassword(length = PASSWORD_LENGTH) {
    let password = '';
    for (let i = 0; i < length; i += 1) {
        password += CHARSET[randomInt(CHARSET.length)];
    }
    return password;
}
