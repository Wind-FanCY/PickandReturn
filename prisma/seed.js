// Seed 脚本：预置 demo 账号 + 覆盖各状态的示例数据，供招聘方一键体验。
// 幂等：先清空四张表再重新插入，可反复运行得到干净的 demo 环境。
// 用法：npx prisma db seed
//
// 数据设计（demo 为主角，出借/借入双视角）：
//   出借视角（demo 是 lender）：
//     1. demo → alice   pending    未来到期      正常出借中
//     2. demo → bob      pending    已逾期        出借方看到逾期
//     3. demo → carol    requested  未来到期      待 demo 确认收到
//   借入视角（demo 是 borrower）：
//     4. alice → demo    pending    临近到期      demo 需归还
//     5. bob → demo      requested  未来到期      demo 已请求、等对方确认
//     6. carol → demo    confirmed  过去          已完成，归入历史记录
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';

// 相对今天算日期，保证"逾期/临近/未来"永远成立。返回 date-only 的 Date。
function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(0, 0, 0, 0);
    return d;
}

async function main() {
    // 1) 清空（顺序照顾外键：先子后父）
    await prisma.$executeRawUnsafe(
        'TRUNCATE TABLE notifications, items, sessions, users RESTART IDENTITY CASCADE'
    );

    // 2) 用户（密码统一 demo123，走真实 bcrypt）
    const passwordHash = await bcrypt.hash('demo123', 10);
    const [demo, alice, bob, carol] = await Promise.all([
        prisma.user.create({ data: { username: 'demo', passwordHash, language: 'zh' } }),
        prisma.user.create({ data: { username: 'alice', passwordHash, language: 'zh' } }),
        prisma.user.create({ data: { username: 'bob', passwordHash, language: 'zh' } }),
        prisma.user.create({ data: { username: 'carol', passwordHash, language: 'zh' } })
    ]);

    // 3) 物品（6 条，覆盖全部状态 × 双视角）
    // #1 demo → alice，pending，未来到期
    await prisma.item.create({
        data: {
            itemDetail: '《设计模式》技术书',
            lentDate: daysFromNow(-10),
            backDate: daysFromNow(20),
            returnStatus: 'pending',
            modifyLimit: 3,
            modifyRemaining: 3,
            lenderId: demo.id,
            borrowerId: alice.id
        }
    });

    // #2 demo → bob，pending，已逾期（出借方视角的逾期）
    await prisma.item.create({
        data: {
            itemDetail: '便携投影仪',
            lentDate: daysFromNow(-40),
            backDate: daysFromNow(-5),
            returnStatus: 'pending',
            modifyLimit: 3,
            modifyRemaining: 2,
            lastAutoReminderDate: daysFromNow(-1),
            lenderId: demo.id,
            borrowerId: bob.id
        }
    });

    // #3 demo → carol，requested，待 demo 确认收到
    const item3 = await prisma.item.create({
        data: {
            itemDetail: '单反相机 + 三脚架',
            lentDate: daysFromNow(-15),
            backDate: daysFromNow(10),
            returnStatus: 'requested',
            returnedAt: daysFromNow(-1),
            modifyLimit: 3,
            modifyRemaining: 3,
            lenderId: demo.id,
            borrowerId: carol.id
        }
    });

    // #4 alice → demo，pending，临近到期（demo 借入，需归还）
    await prisma.item.create({
        data: {
            itemDetail: '人体工学椅',
            lentDate: daysFromNow(-25),
            backDate: daysFromNow(2),
            returnStatus: 'pending',
            modifyLimit: 5,
            modifyRemaining: 4,
            lenderId: alice.id,
            borrowerId: demo.id
        }
    });

    // #5 bob → demo，requested，demo 已请求、等 bob 确认
    await prisma.item.create({
        data: {
            itemDetail: 'Switch 游戏机',
            lentDate: daysFromNow(-20),
            backDate: daysFromNow(15),
            returnStatus: 'requested',
            returnedAt: daysFromNow(-2),
            modifyLimit: 3,
            modifyRemaining: 3,
            lenderId: bob.id,
            borrowerId: demo.id
        }
    });

    // #6 carol → demo，confirmed，已完成（历史记录）
    const item6 = await prisma.item.create({
        data: {
            itemDetail: '登山背包',
            lentDate: daysFromNow(-60),
            backDate: daysFromNow(-30),
            returnStatus: 'confirmed',
            returnedAt: daysFromNow(-32),
            confirmedAt: daysFromNow(-30),
            modifyLimit: 3,
            modifyRemaining: 3,
            lenderId: carol.id,
            borrowerId: demo.id
        }
    });

    // 4) 通知（接收者均为 demo，让 demo 的收件箱有内容）
    await prisma.notification.createMany({
        data: [
            {
                // carol 请求归还 #3 → 通知出借方 demo 确认
                type: 'return_requested',
                message: 'carol 已归还物品：单反相机 + 三脚架，请确认收到',
                read: false,
                userId: demo.id,
                relatedItemId: item3.id
            },
            {
                // alice 催 demo 归还 #4
                type: 'return_reminder',
                message: 'alice 提醒您归还物品：人体工学椅，应还日期临近',
                read: false,
                userId: demo.id,
                relatedItemId: null
            },
            {
                // carol 确认收到 demo 归还的 #6
                type: 'return_confirmed',
                message: 'carol 已确认收到归还：登山背包',
                read: true,
                userId: demo.id,
                relatedItemId: item6.id
            }
        ]
    });

    // 统计输出
    const [users, items, notifs] = await Promise.all([
        prisma.user.count(),
        prisma.item.count(),
        prisma.notification.count()
    ]);
    console.log(`Seed 完成：${users} 用户 / ${items} 物品 / ${notifs} 通知`);
    console.log('Demo 账号：demo / demo123');
}

main()
    .catch((e) => {
        console.error('Seed 失败：', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
