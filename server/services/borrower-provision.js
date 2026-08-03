// 出借时自动创建借入方账号：建 user（mustChangePassword:true）+ 建 item 的事务，
// 以及出借方对"未接管"借入方账号的初始密码重置。
// 契约：.claude/contracts/auto-create-borrower.md
import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';
import { containsSensitiveWord } from './content-filter.js';
import { generatePassword } from './password-generator.js';

const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
const BCRYPT_COST = 10;

// 校验自动建号的借入方用户名：复用注册规则的 正则/dog/敏感词。
// "demo" 与"借给自己"两条已在 addItem 更早的步骤过滤，这里不重复检查。
// 合法返回 null；非法返回对应错误码，调用方决定 HTTP 状态。
export function validateBorrowerUsername(username) {
    if (!username || !USERNAME_RE.test(username)) {
        return 'required-username';
    }
    if (username.toLowerCase() === 'dog') {
        return 'auth-insufficient';
    }
    if (containsSensitiveWord(username)) {
        return 'sensitive-content';
    }
    return null;
}

// 建号 + 建物品的事务：先建 user 再建 item（borrowerId = 新 user.id）。
// bcrypt.hash 在事务外算好。itemData 为 item.create 的 data，不含 borrowerId。
// 用户名唯一约束冲突（竞态抢注）会抛出 Prisma P2002，交由调用方转 409。
export async function provisionBorrowerAndItem({ username, itemData }) {
    const initialPassword = generatePassword();
    const passwordHash = await bcrypt.hash(initialPassword, BCRYPT_COST);

    const item = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: { username, passwordHash, mustChangePassword: true }
        });
        return tx.item.create({
            data: { ...itemData, borrowerId: user.id },
            include: { lender: true, borrower: true }
        });
    });

    return { item, borrowerCredentials: { username, initialPassword } };
}

// 出借方对"未接管"借入方账号的初始密码重置：重新生成明文密码，更新哈希，
// 保持 mustChangePassword=true（授权判断由 controller 做）。
export async function resetBorrowerPassword(item) {
    const initialPassword = generatePassword();
    const passwordHash = await bcrypt.hash(initialPassword, BCRYPT_COST);
    await prisma.user.update({ where: { id: item.borrowerId }, data: { passwordHash } });
    return { username: item.borrower.username, initialPassword };
}
